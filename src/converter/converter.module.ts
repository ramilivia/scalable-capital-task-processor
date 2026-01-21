import { Module } from '@nestjs/common';
import { ConverterService } from './converter.service';
import { SqsModule } from '../sqs/sqs.module';

@Module({
  imports: [
    SqsModule,
  ],
  providers: [ConverterService],
  exports: [ConverterService],
})
export class ConverterModule {}
