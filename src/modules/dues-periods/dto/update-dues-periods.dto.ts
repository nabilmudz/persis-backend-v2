import { PartialType } from '@nestjs/mapped-types';
import { CreateDuesPeriodsDto } from './create-dues-periods.dto';

// PartialType makes all Create fields optional automatically
export class UpdateDuesPeriodsDto extends PartialType(CreateDuesPeriodsDto) {}
