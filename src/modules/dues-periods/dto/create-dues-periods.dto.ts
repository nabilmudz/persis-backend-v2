import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateDuesPeriodsDto {
  @IsNumber()
  @IsNotEmpty()
  year!: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  month!: number;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}