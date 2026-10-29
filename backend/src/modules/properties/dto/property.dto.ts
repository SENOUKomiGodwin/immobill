import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty, MinLength } from 'class-validator';

export enum PropertyType {
  IMMEUBLE = 'IMMEUBLE',
  MAISON = 'MAISON',
  RESIDENCE = 'RESIDENCE',
  BOUTIQUE = 'BOUTIQUE',
  TERRAIN = 'TERRAIN',
}

export class CreatePropertyDto {
  @ApiProperty({ example: 'Immeuble Central' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: PropertyType, example: PropertyType.IMMEUBLE })
  @IsEnum(PropertyType)
  @IsNotEmpty()
  type!: PropertyType;

  @ApiProperty({ example: '123 Rue de la Paix', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Paris', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Notes sur le bien', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePropertyDto {
  @ApiProperty({ example: 'Immeuble Central', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ enum: PropertyType, example: PropertyType.IMMEUBLE, required: false })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiProperty({ example: '123 Rue de la Paix', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Paris', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Notes sur le bien', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryPropertyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: PropertyType, required: false })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

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
