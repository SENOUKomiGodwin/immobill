import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export enum LeaseStatus {
  ACTIF = 'ACTIF',
  TERMINE = 'TERMINE',
}

export class CreateLeaseDto {
  @ApiProperty({ example: 'unit-id' })
  @IsString()
  @IsNotEmpty()
  unit_id!: string;

  @ApiProperty({ example: 'tenant-id' })
  @IsString()
  @IsNotEmpty()
  tenant_id!: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  start_date!: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  rent_amount!: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  charges_amount!: number;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deposit_amount?: number;

  @ApiProperty({ example: 5, description: "Jour du mois pour l'échéance (1-31)" })
  @IsNumber()
  @Min(1)
  @Max(31)
  @IsNotEmpty()
  due_day!: number;

  @ApiProperty({ example: 7, description: 'Jours de grâce avant retard', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grace_days?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  penalty_enabled?: boolean;

  @ApiProperty({ example: 'Notes sur le bail', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeaseDto {
  @ApiProperty({ example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rent_amount?: number;

  @ApiProperty({ example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  charges_amount?: number;

  @ApiProperty({ example: 100000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deposit_amount?: number;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grace_days?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  penalty_enabled?: boolean;

  @ApiProperty({ example: 'Notes sur le bail', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  // Status and unit_id are NOT allowed in update - managed by business logic
}

export class QueryLeaseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: LeaseStatus, required: false })
  @IsOptional()
  @IsEnum(LeaseStatus)
  status?: LeaseStatus;

  @ApiProperty({ required: false, example: 'unit-id' })
  @IsOptional()
  @IsString()
  unit_id?: string;

  @ApiProperty({ required: false, example: 'tenant-id' })
  @IsOptional()
  @IsString()
  tenant_id?: string;

  @ApiProperty({ required: false, example: '1' })
  @IsOptional()
  page?: string;

  @ApiProperty({ required: false, example: '50' })
  @IsOptional()
  limit?: string;

  @ApiProperty({ required: false, example: 'created_date' })
  @IsOptional()
  @IsString()
  sort?: string;
}
