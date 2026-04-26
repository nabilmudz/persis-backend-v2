import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUsersDto } from './create-users.dto';

export class UpdateUsersDto extends PartialType(
  OmitType(CreateUsersDto, ['password'] as const),
) {}
 