import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TipoOcorrencia } from '../entities/occurrence.entity';

export class CreateOccurrenceDto {
  @IsNotEmpty()
  @IsNumber()
  entregaId: number;

  @IsOptional()
  @IsNumber()
  motoristaId?: number;

  @IsNotEmpty()
  @IsEnum(TipoOcorrencia)
  tipo: TipoOcorrencia;

  @IsOptional()
  @IsString()
  descricao?: string;
}
