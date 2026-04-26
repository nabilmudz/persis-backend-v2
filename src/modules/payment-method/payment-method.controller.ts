import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodService } from './payment-method.service';

@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Get()
  findAll() {
    return this.paymentMethodService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentMethodService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdatePaymentMethodDto) {
    return this.paymentMethodService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentMethodService.remove(id);
  }
}
