import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoOcorrencia } from '../entities/occurrence.entity';

export class CreateOccurrenceDto {
  @IsNotEmpty()
  @IsNumber()
  entregaId: number;

  @IsNotEmpty()
  @IsEnum(TipoOcorrencia)
  tipoOcorrencia: TipoOcorrencia;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  descricao: string;

  @IsOptional()
  @IsString()
  fotoProva?: string;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  gpsAccuracyMeters?: number;
}
