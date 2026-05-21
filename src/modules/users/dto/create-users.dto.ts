import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '../schemas/users.schema';

export class CreateUsersDto {
  @IsString()
  @IsNotEmpty()
  npa!: string;

  @IsString()
  @IsNotEmpty()
  fullname!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  no_hp?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password!: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsMongoId()
  @IsOptional()
  region_id?: string;
}