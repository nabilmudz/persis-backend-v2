import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { CreateTransactionsDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  findAll(
    @Query('creator_id') creatorId?: string,
    @Query('region_id') regionId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('acc_status') accStatus?: string,
    @Query('payment_method_id') paymentMethodId?: string,
  ) {
    return this.transactionService.findAll({
      creatorId,
      regionId,
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      accStatus,
      paymentMethodId,
    });
  }

  @Get('export')
  async export(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('region_id') regionId?: string,
  ) {
    return this.transactionService.export(month, year, regionId);
  }
  
  @Get('members-payment-status')
  getMembersPaymentStatus(
    @Query('year', ParseIntPipe) year: number,
    @Query('month') month?: string,
    @Query('region_id') regionId?: string,
  ) {
    const parsedMonth = month ? parseInt(month, 10) : undefined;
    return this.transactionService.getMembersPaymentStatus(year, parsedMonth, regionId);
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
