import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/response-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = await this.tasksService.create({
      type: createTaskDto.type,
      payload: createTaskDto.payload,
    });
    return TaskResponseDto.fromEntity(task);
  }

  @Get()
  async findAll(): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksService.findAll();
    return tasks.map(task => TaskResponseDto.fromEntity(task));
  }

  @Get('sqs')
  async findSQS(@Query('maxMessages') maxMessages?: string) {
    const maxMessagesNumber = maxMessages ? parseInt(maxMessages, 10) : 1;
    return this.tasksService.findSQS(maxMessagesNumber);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TaskResponseDto | null> {
    const task = await this.tasksService.findOne(id);
    if (!task) {
      return null;
    }
    return TaskResponseDto.fromEntity(task);
  }
}
