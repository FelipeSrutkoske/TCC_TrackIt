import { SetMetadata } from '@nestjs/common';
import { TipoUsuario } from '../users/entities/user.entity';

export const Roles = (...roles: TipoUsuario[]) => SetMetadata('roles', roles);
