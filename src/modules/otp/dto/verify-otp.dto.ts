import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsOptional()
  @IsString()
  npa?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(4, 4)
  otp!: string;
}
