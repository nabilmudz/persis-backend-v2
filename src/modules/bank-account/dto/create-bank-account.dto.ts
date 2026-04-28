import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateBankAccountDto {
  @IsMongoId()
  @IsNotEmpty()
  region_id!: string;

  @IsMongoId()
  @IsNotEmpty()
  payment_method_id!: string;

  @IsString()
  @IsOptional()
  bank_name?: string;

  @IsString()
  @IsOptional()
  account_number?: string;

  @IsUrl()
  @IsOptional()
  qris_image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_active: boolean = true;
} 