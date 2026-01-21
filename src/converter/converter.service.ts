import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SqsService, SqsMessageWithReceipt } from '../sqs/sqs.service';
import { Task } from '../tasks/entities/task.entity';

export interface ResultMessage {
  taskId: string;
  type: string;
  result: any;
  status: 'completed' | 'failed';
  error?: string;
}

@Injectable()
export class ConverterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConverterService.name);
  private pollingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private sqsService: SqsService,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private configService: ConfigService,
  ) {}

  private taskQueueUrl: string | null = null;
  private resultsQueueUrl: string | null = null;

  async onModuleInit() {
    await this.ensureQueues();
    const pollInterval = this.configService.get('app.converterPollInterval') || 1000;
    this.logger.log(`Converter service started - polling task queue every ${pollInterval}ms`);
    this.startPolling();
  }

  private readonly TASK_QUEUE_NAME = 'task-queue';

  private async ensureQueues(): Promise<void> {
    // Ensure task queue exists (for receiving tasks)
    this.taskQueueUrl = await this.sqsService.ensureQueueExists(this.TASK_QUEUE_NAME);

    // Ensure results queue exists (for sending results)
    const resultsQueueName = this.configService.get('sqs.resultsQueueName');
    if (!resultsQueueName) {
      throw new Error('Results queue name not configured');
    }
    this.resultsQueueUrl = await this.sqsService.ensureQueueExists(resultsQueueName);
  }

  private async getTaskQueueUrl(): Promise<string> {
    if (!this.taskQueueUrl) {
      await this.ensureQueues();
    }
    return this.taskQueueUrl!;
  }

  private async getResultsQueueUrl(): Promise<string> {
    if (!this.resultsQueueUrl) {
      await this.ensureQueues();
    }
    return this.resultsQueueUrl!;
  }

  async onModuleDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    const pollInterval = this.configService.get('app.converterPollInterval') || 1000;
    this.pollingInterval = setInterval(() => {
      if (!this.isProcessing) {
        this.processTasks().catch((error) => {
          this.logger.error('Error in task processing loop:', error);
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

  private async processTasks() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const taskQueueUrl = await this.getTaskQueueUrl();
      const messages = await this.sqsService.receiveMessages(taskQueueUrl, 1);
      
      if (messages.length === 0) {
        // No messages found - silent return (no logging to avoid log spam)
        this.isProcessing = false;
        return;
      }

      for (const message of messages) {
        await this.processTask(message);
      }
    } catch (error) {
      this.logger.error('Error processing tasks:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processTask(message: SqsMessageWithReceipt) {
    const { taskId, type, payload, receiptHandle } = message;
    
    this.logger.debug(`Processing task ${taskId} of type ${type}`);

    try {
      // Update task status to processing
      await this.taskRepository.update(taskId, { status: 'processing' });

      // Process the task based on type
      let result: any;
      let status: 'completed' | 'failed' = 'completed';
      let error: string | undefined;

      try {
        switch (type) {
          case 'convert_currency':
          case 'convert-currency':
            result = await this.convertCurrency(payload);
            break;
          case 'calculate_interest':
          case 'calculate-interest':
            result = await this.calculateInterest(payload);
            break;
          default:
            throw new Error(`Unknown task type: ${type}`);
        }
      } catch (processError: any) {
        status = 'failed';
        error = processError.message || 'Processing failed';
        result = null;
        this.logger.error(`Task ${taskId} processing failed:`, processError);
      }

      // Update task in database
      await this.taskRepository.update(taskId, {
        status: status === 'completed' ? 'completed' : 'failed',
        result: result,
        error: error,
        completed_at: new Date(),
      });

      // Send result to results queue
      const resultMessage: ResultMessage = {
        taskId,
        type,
        result,
        status,
        error,
      };
      await this.sendResultMessage(resultMessage);

      // Delete message from task queue
      const taskQueueUrl = await this.getTaskQueueUrl();
      await this.sqsService.deleteMessage(taskQueueUrl, receiptHandle);

      this.logger.log(`Task ${taskId} completed with status: ${status}`);
    } catch (error) {
      this.logger.error(`Error processing task ${taskId}:`, error);
      // Update task status to failed
      await this.taskRepository.update(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date(),
      });
    }
  }

  private async convertCurrency(payload: any): Promise<any> {
    const { amount, fromCurrency, toCurrency } = payload;

    if (!amount || !fromCurrency || !toCurrency) {
      throw new Error('Missing required fields: amount, fromCurrency, toCurrency');
    }

    // Mock currency conversion - in production, this would call a real API
    // For now, using a simple mock rate
    const exchangeRates: Record<string, Record<string, number>> = {
      EUR: { USD: 1.1, GBP: 0.85, EUR: 1.0 },
      USD: { EUR: 0.91, GBP: 0.77, USD: 1.0 },
      GBP: { EUR: 1.18, USD: 1.30, GBP: 1.0 },
    };

    const rate = exchangeRates[fromCurrency]?.[toCurrency];
    if (!rate) {
      throw new Error(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
    }

    const convertedAmount = amount * rate;

    return {
      originalAmount: amount,
      fromCurrency,
      toCurrency,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      exchangeRate: rate,
      timestamp: new Date().toISOString(),
    };
  }

  private async calculateInterest(payload: any): Promise<any> {
    const { principal, annualRate, days } = payload;

    if (!principal || annualRate === undefined || !days) {
      throw new Error('Missing required fields: principal, annualRate, days');
    }

    if (principal <= 0 || days <= 0) {
      throw new Error('Principal and days must be positive numbers');
    }

    // Calculate simple interest
    const dailyRate = annualRate / 365;
    const interest = principal * dailyRate * days;
    const totalAmount = principal + interest;

    return {
      principal,
      annualRate,
      days,
      interest: parseFloat(interest.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      timestamp: new Date().toISOString(),
    };
  }

  async sendResultMessage(message: ResultMessage): Promise<void> {
    const queueUrl = await this.getResultsQueueUrl();
    await this.sqsService.sendMessage(queueUrl, message);
    this.logger.debug(`Result message sent to results queue: ${message.taskId}`);
  }
}
