import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { StatusEntrega } from '../entities/delivery.entity';

export class CreateDeliveryDto {
  @IsOptional()
  @IsNumber()
  driverId?: number;

  @IsOptional()
  @IsNumber()
  motoristaId?: number;

  @IsNotEmpty({ message: 'O endereço de destino é obrigatório' })
  @IsString()
  destinationAddress: string;

  @IsOptional()
  @IsDateString()
  deliveryEstimate?: string;

  @IsOptional()
  @IsEnum(StatusEntrega)
  status?: StatusEntrega;
}
