import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from './interfaces/authenticated-user.interface';
import { TipoUsuario } from '../users/entities/user.entity';

@Injectable()
export class MobileDriverGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user?.tipoUsuario !== TipoUsuario.MOTORISTA) {
      throw new ForbiddenException('Acesso permitido apenas para motoristas');
    }

    return true;
  }
}
