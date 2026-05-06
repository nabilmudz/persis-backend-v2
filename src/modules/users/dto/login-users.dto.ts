import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
  @IsString()
  email!: string;

  @IsString()
  password!: string;
}