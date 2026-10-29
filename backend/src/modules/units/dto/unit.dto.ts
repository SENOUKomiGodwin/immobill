import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';

export enum UnitType {
  APPARTEMENT = 'APPARTEMENT',
  STUDIO = 'STUDIO',
  CHAMBRE = 'CHAMBRE',
  BOUTIQUE = 'BOUTIQUE',
  AUTRE = 'AUTRE',
}

export enum UnitStatus {
  LIBRE = 'LIBRE',
  OCCUPE = 'OCCUPE',
}

export class CreateUnitDto {
  @ApiProperty({ example: 'property-id' })
  @IsString()
  @IsNotEmpty()
  property_id!: string;

  @ApiProperty({ example: 'Appartement 1A' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ enum: UnitType, example: UnitType.APPARTEMENT })
  @IsEnum(UnitType)
  @IsNotEmpty()
  type!: UnitType;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  surface?: number;

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

  // Status is NOT allowed in create/update - it comes from lease
}

export class UpdateUnitDto {
  @ApiProperty({ example: 'property-id', required: false })
  @IsOptional()
  @IsString()
  property_id?: string;

  @ApiProperty({ example: 'Appartement 1A', required: false })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ enum: UnitType, example: UnitType.APPARTEMENT, required: false })
  @IsOptional()
  @IsEnum(UnitType)
  type?: UnitType;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  surface?: number;

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

  // Status is NOT allowed in create/update - it comes from lease
}

export class QueryUnitDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: UnitType, required: false })
  @IsOptional()
  @IsEnum(UnitType)
  type?: UnitType;

  @ApiProperty({ enum: UnitStatus, required: false })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @ApiProperty({ required: false, example: 'property-id' })
  @IsOptional()
  @IsString()
  property_id?: string;

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
