import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MobileDriverGuard } from './mobile-driver.guard';
import { TipoUsuario } from '../users/entities/user.entity';

describe('MobileDriverGuard', () => {
  let guard: MobileDriverGuard;

  beforeEach(() => {
    guard = new MobileDriverGuard();
  });

  it('permite acesso para usuarios MOTORISTA', () => {
    const context = createExecutionContext({
      id: 10,
      email: 'motorista@test.com',
      tipoUsuario: TipoUsuario.MOTORISTA,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('bloqueia acesso para usuarios que nao sao MOTORISTA', () => {
    const context = createExecutionContext({
      id: 1,
      email: 'admin@test.com',
      tipoUsuario: TipoUsuario.ADMIN,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

function createExecutionContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
}
