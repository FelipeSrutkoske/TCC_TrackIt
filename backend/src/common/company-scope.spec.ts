import { ForbiddenException } from '@nestjs/common';
import { TipoUsuario } from '../users/entities/user.entity';
import { resolveCompanyScope } from './company-scope';

describe('resolveCompanyScope', () => {
  it('permite admin sem filtro global', () => {
    expect(
      resolveCompanyScope(
        { id: 1, email: 'admin@test.com', tipoUsuario: TipoUsuario.ADMIN, companyId: null },
        undefined,
      ),
    ).toEqual({ companyId: null, isGlobal: true });
  });

  it('permite admin filtrar uma empresa especifica', () => {
    expect(
      resolveCompanyScope(
        { id: 1, email: 'admin@test.com', tipoUsuario: TipoUsuario.ADMIN, companyId: null },
        '2',
      ),
    ).toEqual({ companyId: 2, isGlobal: false });
  });

  it('ignora filtro externo e usa empresa do dashboard', () => {
    expect(
      resolveCompanyScope(
        { id: 2, email: 'dash@test.com', tipoUsuario: TipoUsuario.DASHBOARD, companyId: 3 },
        99,
      ),
    ).toEqual({ companyId: 3, isGlobal: false });
  });

  it('rejeita usuario nao-admin sem empresa vinculada', () => {
    expect(() =>
      resolveCompanyScope(
        { id: 2, email: 'dash@test.com', tipoUsuario: TipoUsuario.DASHBOARD, companyId: null },
        undefined,
      ),
    ).toThrow(ForbiddenException);
  });

  it('trata filtro invalido de admin como visao global', () => {
    expect(
      resolveCompanyScope(
        { id: 1, email: 'admin@test.com', tipoUsuario: TipoUsuario.ADMIN, companyId: null },
        'abc',
      ),
    ).toEqual({ companyId: null, isGlobal: true });
  });
});
