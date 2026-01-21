import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create({
      type: createTaskDto.type,
      payload: createTaskDto.payload,
    });
  }

  @Get('sqs')
  async findSQS(@Query('maxMessages') maxMessages?: string) {
    const maxMessagesNumber = maxMessages ? parseInt(maxMessages, 10) : 1;
    return this.tasksService.findSQS(maxMessagesNumber);
  }
}
