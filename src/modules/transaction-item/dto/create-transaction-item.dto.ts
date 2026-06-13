import { IsNotEmpty, IsMongoId, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateTransactionItemDto {
  @IsMongoId()
  @IsNotEmpty()
  anggota_id!: string;

  @IsMongoId()
  @IsNotEmpty()
  period_id!: string;

  @IsEnum(['pending', 'paid'])
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  bukti_url?: string;
}