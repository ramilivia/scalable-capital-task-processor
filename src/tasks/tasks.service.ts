import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SqsService } from '../sqs/sqs.service';
import { Task } from './entities/task.entity';
import { ResultMessage } from '../converter/converter.service';
import { v4 as uuidv4 } from 'uuid';

interface CreateTaskInput {
  type: string;
  payload: any;
}

@Injectable()
export class TasksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TasksService.name);
  private readonly TASK_QUEUE_NAME = 'task-queue';
  private taskQueueUrl: string | null = null;
  private resultsQueueUrl: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private sqsService: SqsService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureQueues();
    const pollInterval = this.configService.get('app.resultsPollInterval') || 1000;
    this.logger.log(`Tasks service started - polling results queue every ${pollInterval}ms`);
    this.startPolling();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping tasks service polling...');
    this.stopPolling();
    this.logger.log('Tasks service stopped');
  }

  private async ensureQueues(): Promise<void> {
    this.logger.log(`Ensuring task queue exists: ${this.TASK_QUEUE_NAME}`);
    this.taskQueueUrl = await this.sqsService.ensureQueueExists(this.TASK_QUEUE_NAME);
    
    const resultsQueueName = this.configService.get('sqs.resultsQueueName');
    if (!resultsQueueName) {
      throw new Error('Results queue name not configured');
    }
    this.logger.log(`Ensuring results queue exists: ${resultsQueueName}`);
    this.resultsQueueUrl = await this.sqsService.ensureQueueExists(resultsQueueName);
  }

  private startPolling() {
    const pollInterval = this.configService.get('app.resultsPollInterval') || 1000;
    this.pollingInterval = setInterval(() => {
      if (!this.isProcessing) {
        this.processResults().catch((error) => {
          this.logger.error('Error in results processing loop:', error);
        });
      }
    }, pollInterval);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async getResultsQueueUrl(): Promise<string> {
    if (!this.resultsQueueUrl) {
      await this.ensureQueues();
    }
    return this.resultsQueueUrl!;
  }

  private async ensureTaskQueue(): Promise<void> {
    if (!this.taskQueueUrl) {
      this.taskQueueUrl = await this.sqsService.ensureQueueExists(this.TASK_QUEUE_NAME);
    }
  }

  private async getTaskQueueUrl(): Promise<string> {
    if (!this.taskQueueUrl) {
      await this.ensureTaskQueue();
    }
    return this.taskQueueUrl!;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const taskId = uuidv4();

    this.logger.log(`Creating new task ${taskId} of type: ${input.type}`);

    // Persist task in database with pending status
    const task = this.taskRepository.create({
      id: taskId,
      type: input.type,
      status: 'pending',
      payload: input.payload,
    });

    const savedTask = await this.taskRepository.save(task);
    this.logger.debug(`Task ${taskId} saved to database with status: pending`);

    // Send task to SQS queue
    await this.sendTaskMessage({
      taskId: taskId,
      type: input.type,
      payload: input.payload,
    });

    this.logger.log(`Task ${taskId} created and sent to task queue`);
    return savedTask;
  }

  async sendTaskMessage(message: { taskId: string; type: string; payload: any }): Promise<void> {
    const queueUrl = await this.getTaskQueueUrl();
    await this.sqsService.sendMessage(queueUrl, message);
    this.logger.debug(`Task message sent to task queue: ${message.taskId}`);
  }

  async findOne(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    await this.taskRepository.update(id, updates);
    const updated = await this.taskRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Task with id ${id} not found`);
    }
    return updated;
  }

  async findSQS(maxMessages: number = 1): Promise<Array<{ id: string; type: string; payload: any; receiptHandle: string }>> {
    const queueUrl = await this.getTaskQueueUrl();
    const messages = await this.sqsService.receiveMessages(queueUrl, maxMessages);
    
    return messages.map((msg) => ({
      id: msg.taskId,
      type: msg.type,
      payload: msg.payload,
      receiptHandle: msg.receiptHandle,
    }));
  }

  private async processResults() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const resultsQueueUrl = await this.getResultsQueueUrl();
      const messages = await this.sqsService.receiveMessages(resultsQueueUrl, 10);
      
      if (messages.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.debug(`Received ${messages.length} result message(s) from results queue`);
      for (const message of messages) {
        await this.processResultMessage(message);
      }
    } catch (error) {
      this.logger.error('Error processing results:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processResultMessage(message: any & { receiptHandle: string }) {
    const { taskId, status, result, error, receiptHandle } = message as ResultMessage & { receiptHandle: string };
    
    if (!taskId) {
      this.logger.warn('Received result message without taskId, skipping');
      const resultsQueueUrl = await this.getResultsQueueUrl();
      await this.sqsService.deleteMessage(resultsQueueUrl, receiptHandle);
      return;
    }

    try {
      const task = await this.taskRepository.findOne({ where: { id: taskId } });
      
      if (!task) {
        this.logger.warn(`Task ${taskId} not found in database, skipping result processing`);
        const resultsQueueUrl = await this.getResultsQueueUrl();
        await this.sqsService.deleteMessage(resultsQueueUrl, receiptHandle);
        return;
      }

      const updateData: Partial<Task> = {
        status: status === 'processing' ? 'processing' : status === 'completed' ? 'completed' : 'failed',
      };

      if (status === 'completed') {
        updateData.result = result;
        updateData.completed_at = new Date();
        updateData.error = null;
      } else if (status === 'failed') {
        updateData.error = error || 'Unknown error';
        updateData.completed_at = new Date();
        updateData.result = null;
      } else if (status === 'processing') {
        // Keep existing result and error when marking as processing
        // Don't update completed_at
      }

      await this.taskRepository.update(taskId, updateData);
      this.logger.log(`Updated task ${taskId} status to ${status}`);

      // Delete message from results queue
      const resultsQueueUrl = await this.getResultsQueueUrl();
      await this.sqsService.deleteMessage(resultsQueueUrl, receiptHandle);
      this.logger.debug(`Deleted result message for task ${taskId} from results queue`);
    } catch (error) {
      this.logger.error(`Error processing result message for task ${taskId}:`, error);
      // Don't delete message on error so it can be retried
    }
  }

}
