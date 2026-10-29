import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class MonthlyReportDto {
  @IsString()
  @IsOptional()
  period?: string; // YYYY-MM format

  @IsString()
  @IsOptional()
  property_id?: string;
}

export class AnnualReportDto {
  @IsInt()
  @Min(2020)
  year!: number;

  @IsString()
  @IsOptional()
  property_id?: string;
}

export class QueryReportDto {
  @IsString()
  @IsOptional()
  period?: string;

  @IsString()
  @IsOptional()
  property_id?: string;

  @IsInt()
  @IsOptional()
  year?: number;
}
