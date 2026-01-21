import { Injectable } from '@nestjs/common';
import { SqsService } from '../sqs/sqs.service';
import { v4 as uuidv4 } from 'uuid';

interface CreateTaskInput {
  type: string;
  payload: any;
}

@Injectable()
export class TasksService {
  constructor(
    private sqsService: SqsService,
  ) {}

  async create(input: CreateTaskInput): Promise<{ id: string; type: string; payload: any }> {
    const taskId = uuidv4();

    // Send task to SQS queue only
    await this.sqsService.sendMessage({
      taskId: taskId,
      type: input.type,
      payload: input.payload,
    });

    return {
      id: taskId,
      type: input.type,
      payload: input.payload,
    };
  }

  async findSQS(maxMessages: number = 1): Promise<Array<{ id: string; type: string; payload: any; receiptHandle: string }>> {
    const messages = await this.sqsService.receiveMessages(maxMessages);
    
    return messages.map((msg) => ({
      id: msg.taskId,
      type: msg.type,
      payload: msg.payload,
      receiptHandle: msg.receiptHandle,
    }));
  }

}
