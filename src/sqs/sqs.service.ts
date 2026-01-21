import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

export interface SqsMessage {
  taskId: string;
  type: string;
  payload: any;
}

export interface SqsMessageWithReceipt extends SqsMessage {
  receiptHandle: string;
}

@Injectable()
export class SqsService implements OnModuleInit {
  private sqs: AWS.SQS;
  private queueUrl: string;

  constructor(private configService: ConfigService) {
    const awsConfig = this.configService.get('aws');
    const sqsConfig = this.configService.get('sqs');

    this.sqs = new AWS.SQS({
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      region: awsConfig.region,
      endpoint: awsConfig.endpoint,
    });

    this.queueUrl = sqsConfig.queueUrl;
  }

  async onModuleInit() {
    // Ensure queue exists
    await this.ensureQueueExists();
  }

  private async ensureQueueExists(): Promise<void> {
    const queueName = this.configService.get('sqs.queueName');
    
    try {
      const result = await this.sqs
        .getQueueUrl({ QueueName: queueName })
        .promise();
      this.queueUrl = result.QueueUrl;
      console.log(`Queue URL: ${this.queueUrl}`);
    } catch (error: any) {
      if (error.code === 'AWS.SimpleQueueService.NonExistentQueue') {
        // Create queue if it doesn't exist
        try {
          const result = await this.sqs
            .createQueue({
              QueueName: queueName,
              Attributes: {
                VisibilityTimeout: '300',
                MessageRetentionPeriod: '86400',
              },
            })
            .promise();
          this.queueUrl = result.QueueUrl;
          console.log(`Created queue: ${this.queueUrl}`);
        } catch (createError) {
          console.error('Failed to create queue:', createError);
          throw createError;
        }
      } else {
        console.error('Failed to get queue URL:', error);
        throw error;
      }
    }
  }

  async sendMessage(message: SqsMessage): Promise<void> {
    try {
      await this.sqs
        .sendMessage({
          QueueUrl: this.queueUrl,
          MessageBody: JSON.stringify(message),
        })
        .promise();
      console.log(`Message sent to queue: ${message.taskId}`);
    } catch (error) {
      console.error('Failed to send message to SQS:', error);
      throw error;
    }
  }

  async receiveMessages(maxMessages: number = 1): Promise<SqsMessageWithReceipt[]> {
    try {
      const result = await this.sqs
        .receiveMessage({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: maxMessages,
          WaitTimeSeconds: 20, // Long polling
          VisibilityTimeout: 300,
        })
        .promise();

      if (!result.Messages || result.Messages.length === 0) {
        return [];
      }

      return result.Messages.map((msg) => ({
        ...JSON.parse(msg.Body || '{}'),
        receiptHandle: msg.ReceiptHandle || '',
      }));
    } catch (error) {
      console.error('Failed to receive messages from SQS:', error);
      throw error;
    }
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      await this.sqs
        .deleteMessage({
          QueueUrl: this.queueUrl,
          ReceiptHandle: receiptHandle,
        })
        .promise();
    } catch (error) {
      console.error('Failed to delete message from SQS:', error);
      throw error;
    }
  }
}
