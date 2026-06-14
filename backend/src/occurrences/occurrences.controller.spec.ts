import { OccurrencesController } from './occurrences.controller';
import { TipoUsuario } from '../users/entities/user.entity';

describe('OccurrencesController', () => {
  it('deve listar ocorrencias usando o escopo da empresa do usuario', async () => {
    const service = {
      findAllWithSummary: jest.fn().mockResolvedValue({ items: [], summary: { total: 0 } }),
    };
    const controller = new OccurrencesController(service as never);
    const user = {
      id: 7,
      email: 'dashboard@test.com',
      tipoUsuario: TipoUsuario.DASHBOARD,
      companyId: 2,
    };

    await (controller as any).findAll({ companyId: '9' }, user);

    expect(service.findAllWithSummary).toHaveBeenCalledWith(
      { companyId: '9' },
      { companyId: 2, isGlobal: false },
    );
  });
});
