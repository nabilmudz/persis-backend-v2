import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { CreateTransactionsDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  findAll() {
    return this.transactionService.findAll();
  }

  @Get('export')
  async export(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.transactionService.export(month, year);
  }
  
  @Get('members-payment-status')
  getMembersPaymentStatus(
    @Query('year', ParseIntPipe) year: number,
    @Query('region_id') regionId?: string,
  ) {
    return this.transactionService.getMembersPaymentStatus(year, regionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateTransactionsDto) {
    return this.transactionService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateTransactionDto) {
    return this.transactionService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionService.remove(id);
  }
  
}
