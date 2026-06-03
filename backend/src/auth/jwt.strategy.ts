import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { TipoUsuario } from '../users/entities/user.entity';
import { getJwtSecret } from './jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
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
    return {
      id: payload.sub,
      email: payload.email,
      tipoUsuario: payload.tipoUsuario,
    };
  }
}
