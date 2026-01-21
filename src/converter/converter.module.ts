import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConverterService } from './converter.service';
import { Task } from '../tasks/entities/task.entity';
import { SqsModule } from '../sqs/sqs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    SqsModule,
  ],
  providers: [ConverterService],
  exports: [ConverterService],
})
export class ConverterModule {}
