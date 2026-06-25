import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TipoUsuario } from '../users/entities/user.entity';

export type CompanyScope = {
  companyId: number | null;
  isGlobal: boolean;
};

export function resolveCompanyScope(
  user: AuthenticatedUser,
  requestedCompanyId?: number | string | null,
): CompanyScope {
  if (user.tipoUsuario === TipoUsuario.ADMIN) {
    const companyId = toPositiveIntegerOrNull(requestedCompanyId);

    return {
      companyId,
      isGlobal: companyId === null,
    };
  }

  if (!user.companyId || user.companyId <= 0) {
    throw new ForbiddenException('Usuario sem empresa vinculada');
  }

  return {
    companyId: user.companyId,
    isGlobal: false,
  };
}

function toPositiveIntegerOrNull(value?: number | string | null): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}
