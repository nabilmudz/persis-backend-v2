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
  @Matches(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, {
    message: 'no_hp format tidak valid',
  })
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