import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsBoolean,
  IsInt,
  IsObject,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoUsuario } from '../entities/user.entity';

export class CreateDriverProfileDto {
  @IsNotEmpty({ message: 'A CNH é obrigatória para motorista' })
  @MaxLength(20)
  cnh: string;

  @IsOptional()
  @MaxLength(10)
  placaVeiculo?: string | null;

  @IsOptional()
  @MaxLength(50)
  tipoVeiculo?: string | null;

  @IsOptional()
  @IsBoolean()
  disponivel?: boolean;
}

export class CreateUserDto {
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @IsNotEmpty({ message: 'O tipo de usuário é obrigatório' })
  @IsEnum(TipoUsuario, { message: 'Tipo de usuário inválido' })
  tipoUsuario: TipoUsuario;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  companyId?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateDriverProfileDto)
  driverProfile?: CreateDriverProfileDto;
}
