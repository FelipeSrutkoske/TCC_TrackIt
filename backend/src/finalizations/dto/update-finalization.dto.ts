import { PartialType } from '@nestjs/mapped-types';
import { CreateFinalizationDto } from './create-finalization.dto';

export class UpdateFinalizationDto extends PartialType(CreateFinalizationDto) {}
