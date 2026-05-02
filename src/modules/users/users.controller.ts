import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { UsersService } from './users.service';
import { LoginUserDto } from './dto/login-users.dto';
import { VerifyOtpDto } from '../otp/dto/verify-otp.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('login')
  async login(@Body() payload: LoginUserDto) {
    return this.usersService.login(payload);
  }

  @Post()
  create(@Body() payload: CreateUsersDto) {
    return this.usersService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateUsersDto) {
    return this.usersService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('activate')
  async activate(@Body() payload: any) {
    return this.usersService.activate(payload);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.usersService.verifyOtp(dto.npa, dto.otp);
  }
}
