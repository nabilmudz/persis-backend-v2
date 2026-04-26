import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionsDto } from './create-transaction.dto';

// PartialType makes all Create fields optional automatically
export class UpdateTransactionDto extends PartialType(CreateTransactionsDto) {}
