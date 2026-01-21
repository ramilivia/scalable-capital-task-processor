import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { SqsModule } from '../sqs/sqs.module';
import { Task } from './entities/task.entity';

@Module({
  imports: [
    SqsModule,
    TypeOrmModule.forFeature([Task]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
