import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionItemDto } from './create-transaction-item.dto';

// PartialType makes all Create fields optional automatically
export class UpdateTransactionItemDto extends PartialType(CreateTransactionItemDto) {}
