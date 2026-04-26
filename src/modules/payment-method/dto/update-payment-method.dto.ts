import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentMethodDto } from './create-payment-method.dto';

// PartialType makes all Create fields optional automatically
export class UpdatePaymentMethodDto extends PartialType(CreatePaymentMethodDto) {}
