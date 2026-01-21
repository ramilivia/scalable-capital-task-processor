import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

export interface SqsMessageWithReceipt {
  [key: string]: any;
  receiptHandle: string;
}

@Injectable()
export class SqsService {
  private sqs: AWS.SQS;

  constructor(private configService: ConfigService) {
    const awsConfig = this.configService.get('aws');

    this.sqs = new AWS.SQS({
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      region: awsConfig.region,
      endpoint: awsConfig.endpoint,
    });
  }

  async ensureQueueExists(queueName: string): Promise<string> {
    if (!queueName) {
      throw new Error('Queue name is required');
    }

    try {
      const result = await this.sqs
        .getQueueUrl({ QueueName: queueName })
        .promise();
      const queueUrl = result.QueueUrl || '';
      console.log(`Queue URL for ${queueName}: ${queueUrl}`);
      return queueUrl;
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
          const queueUrl = result.QueueUrl || '';
          console.log(`Created queue ${queueName}: ${queueUrl}`);
          return queueUrl;
        } catch (createError) {
          console.error(`Failed to create queue ${queueName}:`, createError);
          throw createError;
        }
      } else {
        console.error(`Failed to get queue URL for ${queueName}:`, error);
        throw error;
      }
    }
  }

  async sendMessage(queueUrl: string, message: any): Promise<void> {
    try {
      await this.sqs
        .sendMessage({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(message),
        })
        .promise();
    } catch (error) {
      console.error('Failed to send message to SQS:', error);
      throw error;
    }
  }

  async receiveMessages(queueUrl: string, maxMessages: number = 1): Promise<SqsMessageWithReceipt[]> {
    try {
      const result = await this.sqs
        .receiveMessage({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: maxMessages,
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

  async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    try {
      await this.sqs
        .deleteMessage({
          QueueUrl: queueUrl,
          ReceiptHandle: receiptHandle,
        })
        .promise();
    } catch (error) {
      console.error('Failed to delete message from SQS:', error);
      throw error;
    }
  }
}
