import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusEntrega } from '../entities/delivery.entity';
import { CreateDeliveryDetailDto } from './create-delivery-detail.dto';

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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryDetailDto)
  detalhesEntrega: CreateDeliveryDetailDto[];
}
