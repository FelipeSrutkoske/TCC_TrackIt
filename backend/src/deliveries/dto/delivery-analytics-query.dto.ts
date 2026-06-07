import { IsDateString, IsEnum, IsNumberString, IsOptional } from 'class-validator';
import { StatusEntrega } from '../entities/delivery.entity';

export class DeliveryAnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumberString()
  companyId?: string;

  @IsOptional()
  @IsNumberString()
  driverId?: string;

  @IsOptional()
  @IsEnum(StatusEntrega)
  status?: StatusEntrega;
}
