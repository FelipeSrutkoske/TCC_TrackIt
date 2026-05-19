import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFinalizationDto {
  @IsNotEmpty()
  @IsNumber()
  deliveryId: number;

  @IsNotEmpty()
  @IsString()
  receiverName: string;

  @IsOptional()
  @IsString()
  receiverDocument?: string;

  @IsOptional()
  @IsString()
  receiverRelation?: string;

  @IsNotEmpty()
  @IsString()
  signature: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}
