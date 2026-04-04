import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { TipoUsuario } from '../entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @IsOptional()
  @IsEnum(TipoUsuario, { message: 'Tipo de usuário inválido' })
  tipoUsuario?: TipoUsuario;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
