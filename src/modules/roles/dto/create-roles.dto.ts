import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateRolesDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}