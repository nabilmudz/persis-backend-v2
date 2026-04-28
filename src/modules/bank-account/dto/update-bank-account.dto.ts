import { PartialType } from '@nestjs/mapped-types';
import { CreateBankAccountDto } from './create-bank-account.dto';

// PartialType makes all Create fields optional automatically
export class UpdateBankAccountDto extends PartialType(CreateBankAccountDto) {}
