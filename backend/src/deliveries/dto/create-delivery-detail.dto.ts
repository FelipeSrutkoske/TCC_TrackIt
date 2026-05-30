import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDeliveryDetailDto {
  @IsNotEmpty({ message: 'A descricao do detalhe da entrega e obrigatoria' })
  @IsString()
  @MaxLength(150)
  descricao: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoria?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  pesoKg: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  volumeM3: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorDeclarado: number;
}
