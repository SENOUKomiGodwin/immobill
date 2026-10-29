import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  IsDateString,
  IsEnum,
} from 'class-validator';

export enum PaymentMethod {
  ESPACES = 'ESPACES',
  MOBILE_MONEY = 'MOBILE_MONEY',
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'due-id' })
  @IsString()
  @IsNotEmpty()
  due_id!: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.VIREMENT })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method!: PaymentMethod;

  @ApiProperty({ example: 'REF-12345', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ example: 'Note sur le paiement', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CancelPaymentDto {
  @ApiProperty({ example: 'Erreur de paiement' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class QueryPaymentDto {
  @ApiProperty({ required: false, example: 'due-id' })
  @IsOptional()
  @IsString()
  due_id?: string;

  @ApiProperty({ required: false, example: 'lease-id' })
  @IsOptional()
  @IsString()
  lease_id?: string;

  @ApiProperty({ enum: PaymentMethod, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiProperty({ required: false, example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiProperty({ required: false, example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  to_date?: string;

  @ApiProperty({ required: false, example: '1' })
  @IsOptional()
  page?: string;

  @ApiProperty({ required: false, example: '50' })
  @IsOptional()
  limit?: string;

  @ApiProperty({ required: false, example: 'payment_date' })
  @IsOptional()
  @IsString()
  sort?: string;
}
