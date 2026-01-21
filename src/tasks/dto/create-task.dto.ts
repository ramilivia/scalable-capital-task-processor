import { IsString, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ConvertCurrencyPayload {
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  toCurrency: string;
}

class CalculateInterestPayload {
  @IsNotEmpty()
  principal: number;

  @IsNotEmpty()
  annualRate: number;

  @IsNotEmpty()
  days: number;
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  payload: ConvertCurrencyPayload | CalculateInterestPayload;
}
