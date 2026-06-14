import { validate } from 'class-validator';
import { TipoUsuario } from '../entities/user.entity';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  it('rejeita companyId zero', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      nome: 'Cliente Operador',
      email: 'cliente@test.com',
      senha: '123456',
      tipoUsuario: TipoUsuario.DASHBOARD,
      companyId: 0,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('companyId');
  });
});
