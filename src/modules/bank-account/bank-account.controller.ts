import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccountService } from './bank-account.service';

@Controller('bank-account')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Get()
  findAll() {
    return this.bankAccountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bankAccountService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateBankAccountDto) {
    return this.bankAccountService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateBankAccountDto) {
    return this.bankAccountService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bankAccountService.remove(id);
  }
}
