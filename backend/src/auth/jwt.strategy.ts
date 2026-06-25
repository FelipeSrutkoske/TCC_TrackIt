import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { TipoUsuario } from '../users/entities/user.entity';
import { getJwtSecret } from './jwt.config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(configService),
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
    tipoUsuario: TipoUsuario;
  }): Promise<AuthenticatedUser> {
    let user: {
      id: number;
      email: string;
      tipoUsuario: TipoUsuario;
      ativo?: boolean;
      companyId?: number | null;
    };

    try {
      user = await this.usersService.findOne(payload.sub);
    } catch {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.ativo === false) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      id: user.id,
      email: user.email,
      tipoUsuario: user.tipoUsuario,
      companyId: user.companyId ?? null,
    };
  }
}
