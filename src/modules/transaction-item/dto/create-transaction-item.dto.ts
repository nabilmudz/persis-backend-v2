import { IsNotEmpty, IsMongoId, IsEnum, IsOptional } from 'class-validator';

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
}