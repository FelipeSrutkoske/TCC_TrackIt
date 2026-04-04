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

  @IsOptional()
  @IsString()
  signatureUrl?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
