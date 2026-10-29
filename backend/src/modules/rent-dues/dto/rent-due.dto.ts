import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum RentDueStatus {
  ATTENTE = 'Attente',
  PARTIEL = 'Partiel',
  PAYE = 'Payé',
  RETARD = 'Retard',
  ANNULE = 'Annulé',
}

export class QueryRentDueDto {
  @ApiProperty({ required: false, example: 'lease-id' })
  @IsOptional()
  @IsString()
  lease_id?: string;

  @ApiProperty({ enum: RentDueStatus, required: false })
  @IsOptional()
  @IsEnum(RentDueStatus)
  status?: RentDueStatus;

  @ApiProperty({ required: false, example: '2024-01' })
  @IsOptional()
  @IsString()
  period?: string;

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

  @ApiProperty({ required: false, example: 'due_date' })
  @IsOptional()
  @IsString()
  sort?: string;
}
