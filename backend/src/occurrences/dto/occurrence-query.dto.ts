import { IsDateString, IsEnum, IsNumberString, IsOptional } from 'class-validator';
import { StatusEntrega } from '../../deliveries/entities/delivery.entity';
import { TipoOcorrencia } from '../entities/occurrence.entity';

export class OccurrenceQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TipoOcorrencia)
  tipoOcorrencia?: TipoOcorrencia;

  @IsOptional()
  @IsNumberString()
  companyId?: string;

  @IsOptional()
  @IsNumberString()
  driverId?: string;

  @IsOptional()
  @IsNumberString()
  deliveryId?: string;

  @IsOptional()
  @IsEnum(StatusEntrega)
  status?: StatusEntrega;
}
