import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SqsService } from '../sqs/sqs.service';
import { Task } from './entities/task.entity';
import { v4 as uuidv4 } from 'uuid';

interface CreateTaskInput {
  type: string;
  payload: any;
}

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly TASK_QUEUE_NAME = 'task-queue';
  private taskQueueUrl: string | null = null;

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private sqsService: SqsService,
  ) {}

  async onModuleInit() {
    await this.ensureTaskQueue();
  }

  private async ensureTaskQueue(): Promise<void> {
    this.taskQueueUrl = await this.sqsService.ensureQueueExists(this.TASK_QUEUE_NAME);
  }

  private async getTaskQueueUrl(): Promise<string> {
    if (!this.taskQueueUrl) {
      await this.ensureTaskQueue();
    }
    return this.taskQueueUrl!;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const taskId = uuidv4();

    // Persist task in database with pending status
    const task = this.taskRepository.create({
      id: taskId,
      type: input.type,
      status: 'pending',
      payload: input.payload,
    });

    const savedTask = await this.taskRepository.save(task);

    // Send task to SQS queue
    await this.sendTaskMessage({
      taskId: taskId,
      type: input.type,
      payload: input.payload,
    });

    return savedTask;
  }

  async sendTaskMessage(message: { taskId: string; type: string; payload: any }): Promise<void> {
    const queueUrl = await this.getTaskQueueUrl();
    await this.sqsService.sendMessage(queueUrl, message);
    console.log(`Task message sent to task queue: ${message.taskId}`);
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

}
