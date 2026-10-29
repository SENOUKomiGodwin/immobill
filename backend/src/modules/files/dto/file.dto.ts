import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsOptional()
  content_type?: string;
}

export class SignedUrlDto {
  @IsString()
  @IsNotEmpty()
  file_key!: string;

  @IsString()
  @IsOptional()
  expires_in?: string; // seconds, default 3600
}
