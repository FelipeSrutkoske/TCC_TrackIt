import { CompaniesController } from './companies.controller';
import { TipoUsuario } from '../users/entities/user.entity';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let companiesService: any;

  const dashboardUser = {
    id: 2,
    email: 'dash@test.com',
    tipoUsuario: TipoUsuario.DASHBOARD,
    companyId: 1,
  };

  beforeEach(() => {
    companiesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllWithAnalytics: jest.fn(),
      findAnalytics: jest.fn(),
    };
    controller = new CompaniesController(companiesService);
  });

  it('passa escopo do usuario ao listar empresas', () => {
    controller.findAll(dashboardUser);

    expect(companiesService.findAll).toHaveBeenCalledWith({
      companyId: 1,
      isGlobal: false,
    });
  });

  it('passa escopo do usuario ao listar analytics', () => {
    controller.findAllWithAnalytics(dashboardUser);

    expect(companiesService.findAllWithAnalytics).toHaveBeenCalledWith({
      companyId: 1,
      isGlobal: false,
    });
  });

  it('passa escopo do usuario ao consultar analytics de uma empresa', () => {
    controller.findAnalytics('99', dashboardUser);

    expect(companiesService.findAnalytics).toHaveBeenCalledWith(99, {
      companyId: 1,
      isGlobal: false,
    });
  });
});
