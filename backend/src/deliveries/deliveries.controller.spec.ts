import { DeliveriesController } from './deliveries.controller';
import { TipoUsuario } from '../users/entities/user.entity';
import { StatusEntrega } from './entities/delivery.entity';

describe('DeliveriesController', () => {
  let controller: DeliveriesController;
  let deliveriesService: any;

  const dashboardUser = {
    id: 2,
    email: 'dash@test.com',
    tipoUsuario: TipoUsuario.DASHBOARD,
    companyId: 1,
  };

  beforeEach(() => {
    deliveriesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      getStats: jest.fn(),
      getAnalytics: jest.fn(),
      getAlerts: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    controller = new DeliveriesController(deliveriesService);
  });

  it('passa escopo do usuario ao criar entrega', () => {
    const body = {
      destinationAddress: 'Rua A',
      empresaId: 99,
      detalhesEntrega: [{ descricao: 'Caixa', quantidade: 1 }],
    };

    controller.create(body as any, dashboardUser);

    expect(deliveriesService.create).toHaveBeenCalledWith(body, {
      companyId: 1,
      isGlobal: false,
    });
  });

  it('passa escopo do usuario nas consultas operacionais', () => {
    controller.findAll(dashboardUser, '99');
    controller.getStats(dashboardUser, '99');
    controller.getAlerts(dashboardUser, '99');
    controller.findOne('5', dashboardUser, '99');

    expect(deliveriesService.findAll).toHaveBeenCalledWith({
      companyId: 1,
      isGlobal: false,
    });
    expect(deliveriesService.getStats).toHaveBeenCalledWith({
      companyId: 1,
      isGlobal: false,
    });
    expect(deliveriesService.getAlerts).toHaveBeenCalledWith({
      companyId: 1,
      isGlobal: false,
    });
    expect(deliveriesService.findOne).toHaveBeenCalledWith(5, {
      companyId: 1,
      isGlobal: false,
    });
  });

  it('passa escopo do usuario em analytics e mutacoes', () => {
    const query = { companyId: '99', status: StatusEntrega.EM_ROTA };
    const update = { empresaId: 99, status: StatusEntrega.CANCELADO };

    controller.getAnalytics(query, dashboardUser, '99');
    controller.update('5', update as any, dashboardUser, '99');
    controller.remove('5', dashboardUser, '99');

    expect(deliveriesService.getAnalytics).toHaveBeenCalledWith(query, {
      companyId: 1,
      isGlobal: false,
    });
    expect(deliveriesService.update).toHaveBeenCalledWith(5, update, {
      companyId: 1,
      isGlobal: false,
    });
    expect(deliveriesService.remove).toHaveBeenCalledWith(5, {
      companyId: 1,
      isGlobal: false,
    });
  });
});
