import { Request } from 'express';
import { TipoUsuario } from '../../users/entities/user.entity';

export interface AuthenticatedUser {
  id: number;
  email: string;
  tipoUsuario: TipoUsuario;
  companyId: number | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
