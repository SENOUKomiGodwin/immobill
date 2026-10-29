import { IsString, IsInt, IsOptional, IsEnum, Min } from 'class-validator';

export class CreateReminderDto {
  @IsString()
  due_id!: string;

  @IsInt()
  @Min(1)
  tier!: number; // 1 = J+1, 7 = J+7, 15 = J+15

  @IsString()
  @IsEnum(['whatsapp', 'sms', 'email', 'autre'])
  method!: string;

  @IsString()
  @IsOptional()
  message?: string;
}

export class QueryReminderDto {
  @IsString()
  @IsOptional()
  due_id?: string;

  @IsInt()
  @IsOptional()
  tier?: number;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;

  @IsString()
  @IsOptional()
  sort?: string;
}
