import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { SqsModule } from '../sqs/sqs.module';

@Module({
  imports: [SqsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
