import { IsString, IsInt, IsBoolean, IsOptional, IsDateString, IsEnum, IsNotEmpty } from 'class-validator';

enum ExpenseCategory {
  PLOMBERIE = 'Plomberie',
  PEINTURE = 'Peinture',
  ELECTRICITE = 'Électricité',
  TAXES = 'Taxes',
  ASSURANCE = 'Assurance',
  GARDIENNAGE = 'Gardiennage',
  REPARATION = 'Réparation',
  AUTRE = 'Autre',
}

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  property_id!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  vendor?: string;

  @IsInt()
  @IsNotEmpty()
  amount!: number;

  @IsDateString()
  @IsNotEmpty()
  expense_date!: string;

  @IsBoolean()
  @IsOptional()
  paid?: boolean;

  @IsBoolean()
  @IsOptional()
  refacture?: boolean;

  @IsInt()
  @IsOptional()
  recovered_amount?: number;

  @IsString()
  @IsOptional()
  receipt_uri?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  property_id?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  vendor?: string;

  @IsInt()
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  expense_date?: string;

  @IsBoolean()
  @IsOptional()
  paid?: boolean;

  @IsBoolean()
  @IsOptional()
  refacture?: boolean;

  @IsInt()
  @IsOptional()
  recovered_amount?: number;

  @IsString()
  @IsOptional()
  receipt_uri?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CancelExpenseDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class QueryExpenseDto {
  @IsString()
  @IsOptional()
  property_id?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  from_date?: string;

  @IsString()
  @IsOptional()
  to_date?: string;

  @IsBoolean()
  @IsOptional()
  paid?: string;

  @IsBoolean()
  @IsOptional()
  refacture?: string;

  @IsString()
  @IsOptional()
  sort?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
