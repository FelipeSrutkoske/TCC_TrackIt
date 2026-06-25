import { GUARDS_METADATA } from '@nestjs/common/constants';
import { DeliveriesController } from '../deliveries/deliveries.controller';
import { FinalizationsController } from '../finalizations/finalizations.controller';
import { OccurrencesController } from '../occurrences/occurrences.controller';
import { DeliveryProofEmailsController } from '../proof-emails/proof-emails.controller';
import { UsersController } from '../users/users.controller';
import { CompaniesController } from '../companies/companies.controller';
import { RolesGuard } from './roles.guard';
import { TipoUsuario } from '../users/entities/user.entity';

const ADMIN_DASHBOARD_ROLES = [TipoUsuario.ADMIN, TipoUsuario.DASHBOARD];
const ADMIN_ROLES = [TipoUsuario.ADMIN];

function expectRoles(
  controller: object,
  methodName: string,
  roles = ADMIN_DASHBOARD_ROLES,
) {
  expect(Reflect.getMetadata('roles', controller[methodName])).toEqual(roles);
}

function expectRolesGuard(controller: Function) {
  expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toContain(
    RolesGuard,
  );
}

describe('administrative route roles', () => {
  it('protege rotas administrativas de deliveries com ADMIN ou DASHBOARD', () => {
    expectRolesGuard(DeliveriesController);
    expectRoles(DeliveriesController.prototype, 'create');
    expectRoles(DeliveriesController.prototype, 'findAll');
    expectRoles(DeliveriesController.prototype, 'getStats');
    expectRoles(DeliveriesController.prototype, 'getAnalytics');
    expectRoles(DeliveriesController.prototype, 'getAlerts');
    expectRoles(DeliveriesController.prototype, 'findOne');
    expectRoles(DeliveriesController.prototype, 'update');
    expectRoles(DeliveriesController.prototype, 'remove');
  });

  it('mantem rotas mobile de deliveries sem role administrativa', () => {
    expect(
      Reflect.getMetadata('roles', DeliveriesController.prototype.getCurrent),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata('roles', DeliveriesController.prototype.getHistory),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata('roles', DeliveriesController.prototype.start),
    ).toBeUndefined();
  });

  it('protege rotas administrativas de ocorrencias e finalizacoes', () => {
    expectRolesGuard(OccurrencesController);
    expectRolesGuard(FinalizationsController);
    expectRoles(OccurrencesController.prototype, 'findAll');
    expectRoles(OccurrencesController.prototype, 'findOne');
    expectRoles(OccurrencesController.prototype, 'update');
    expectRoles(OccurrencesController.prototype, 'remove');
    expectRoles(FinalizationsController.prototype, 'findAll');
    expectRoles(FinalizationsController.prototype, 'findOne');
    expectRoles(FinalizationsController.prototype, 'update');
    expectRoles(FinalizationsController.prototype, 'remove');
  });

  it('protege rotas administrativas de usuarios', () => {
    expectRolesGuard(UsersController);
    expectRoles(UsersController.prototype, 'create');
    expectRoles(UsersController.prototype, 'findAll');
    expectRoles(UsersController.prototype, 'findOne');
    expectRoles(UsersController.prototype, 'update', ADMIN_DASHBOARD_ROLES);
    expectRoles(UsersController.prototype, 'remove', ADMIN_ROLES);
  });

  it('protege rotas de clientes e cadastro de empresa', () => {
    expectRolesGuard(CompaniesController);
    expectRoles(CompaniesController.prototype, 'create', ADMIN_ROLES);
    expectRoles(CompaniesController.prototype, 'findAll');
    expectRoles(CompaniesController.prototype, 'findAllWithAnalytics');
    expectRoles(CompaniesController.prototype, 'findAnalytics');
  });

  it('protege rotas de envio de comprovante por email', () => {
    expectRolesGuard(DeliveryProofEmailsController);
    expectRoles(DeliveryProofEmailsController.prototype, 'findByDelivery');
    expectRoles(DeliveryProofEmailsController.prototype, 'send');
  });
});
