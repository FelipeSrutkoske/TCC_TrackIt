import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeliveriesController } from '../src/deliveries/deliveries.controller';
import { DeliveriesService } from '../src/deliveries/deliveries.service';
import {
  Delivery,
  StatusEntrega,
} from '../src/deliveries/entities/delivery.entity';
import { Company } from '../src/deliveries/entities/company.entity';
import { Driver } from '../src/users/entities/driver.entity';
import { FinalizationsController } from '../src/finalizations/finalizations.controller';
import { FinalizationsService } from '../src/finalizations/finalizations.service';
import { Finalization } from '../src/finalizations/entities/finalization.entity';
import { DeliveryProofEmailsService } from '../src/proof-emails/proof-emails.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { MobileDriverGuard } from '../src/auth/mobile-driver.guard';
import { UsersService } from '../src/users/users.service';
import { TipoUsuario } from '../src/users/entities/user.entity';
import { DataSource } from 'typeorm';

const deliveriesFixture = [
  {
    id: 1,
    driverId: 701,
    destinationAddress: 'Rua A',
    status: StatusEntrega.AGUARDANDO_MOTORISTA,
  },
  {
    id: 2,
    driverId: 701,
    destinationAddress: 'Rua B',
    status: StatusEntrega.EM_ROTA,
  },
  {
    id: 3,
    driverId: 701,
    destinationAddress: 'Rua C',
    status: StatusEntrega.ENTREGUE,
  },
  {
    id: 4,
    driverId: 701,
    destinationAddress: 'Rua D',
    status: StatusEntrega.CANCELADO,
  },
  {
    id: 5,
    driverId: 880,
    destinationAddress: 'Rua E',
    status: StatusEntrega.AGUARDANDO_MOTORISTA,
  },
  {
    id: 6,
    driverId: 880,
    destinationAddress: 'Rua F',
    status: StatusEntrega.ENTREGUE,
  },
];

const mockUsersService = {
  resolveDriverProfileId: jest.fn(),
};

const mockRepository = {
  find: jest.fn(async (options: any) =>
    filterDeliveries(options).sort((left, right) => right.id - left.id),
  ),
  count: jest.fn(async (options: any) => filterDeliveries(options).length),
  findOne: jest.fn(async (options: any) => findDelivery(options?.where)),
  update: jest.fn(async (id: number, data: Partial<Delivery>) => {
    const delivery = deliveriesFixture.find((item) => item.id === id);

    if (delivery) {
      Object.assign(delivery, data);
    }

    return { affected: delivery ? 1 : 0 };
  }),
};

const mockCompanyRepository = {
  findOne: jest.fn(),
};

const mockDriverRepository = {
  findOne: jest.fn(),
};

const finalizationsFixture: any[] = [];

const mockFinalizationsRepository = {
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn(async (data: any) => {
    const finalization = {
      id: finalizationsFixture.length + 1,
      ...data,
      finalizedAt: new Date('2026-01-01T10:00:00.000Z'),
    };

    finalizationsFixture.push(finalization);

    return finalization;
  }),
  find: jest.fn(async () => [...finalizationsFixture]),
  findOne: jest.fn(async (options: any) => {
    const id = options?.where?.id;
    return finalizationsFixture.find((item) => item.id === id) ?? null;
  }),
  remove: jest.fn(async (finalization: any) => {
    const index = finalizationsFixture.findIndex(
      (item) => item.id === finalization.id,
    );
    if (index >= 0) {
      finalizationsFixture.splice(index, 1);
    }
  }),
};

const mockProofEmailsService = {
  sendDeliveryProof: jest.fn(),
};

const mockDataSource = {
  transaction: jest.fn(async (callback: any) =>
    callback({
      getRepository: (entity: any) => {
        if (entity === Finalization) {
          return mockFinalizationsRepository;
        }

        if (entity === Delivery) {
          return mockRepository;
        }

        throw new Error('Repository not mocked in e2e harness');
      },
    }),
  ),
};

function filterDeliveries(options: { where?: any } | undefined) {
  const where = options?.where;

  if (!where) {
    return deliveriesFixture;
  }

  const conditions = Array.isArray(where) ? where : [where];

  return deliveriesFixture.filter((delivery) =>
    conditions.some(
      (condition) =>
        (condition.driverId === undefined ||
          delivery.driverId === condition.driverId) &&
        (condition.status === undefined ||
          delivery.status === condition.status),
    ),
  );
}

function findDelivery(where: any) {
  if (!where) {
    return null;
  }

  return (
    deliveriesFixture.find(
      (delivery) =>
        (where.id === undefined || delivery.id === where.id) &&
        (where.driverId === undefined || delivery.driverId === where.driverId),
    ) ?? null
  );
}

describe('Mobile driver deliveries (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    mockUsersService.resolveDriverProfileId.mockImplementation(
      async (userId: number) => {
        if (userId === 77) return 701;
        if (userId === 88) return 880;
        return null;
      },
    );

    const moduleRef = await Test.createTestingModule({
      imports: [MobileDriverDeliveriesHarnessModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestJwtAuthGuard())
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    finalizationsFixture.splice(0, finalizationsFixture.length);
    deliveriesFixture.splice(
      0,
      deliveriesFixture.length,
      ...buildDeliveriesFixture(),
    );
  });

  it('retorna 403 para usuario autenticado sem papel de motorista', async () => {
    await request(app.getHttpServer())
      .get('/deliveries/me')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .expect(403);
  });

  it('retorna apenas entregas ativas do proprio motorista autenticado', async () => {
    await request(app.getHttpServer())
      .get('/deliveries/me')
      .set('x-test-user-role', TipoUsuario.MOTORISTA)
      .set('x-test-user-id', '77')
      .expect(200)
      .expect([
        {
          id: 2,
          driverId: 701,
          destinationAddress: 'Rua B',
          status: StatusEntrega.EM_ROTA,
        },
        {
          id: 1,
          driverId: 701,
          destinationAddress: 'Rua A',
          status: StatusEntrega.AGUARDANDO_MOTORISTA,
        },
      ]);
  });

  it('retorna historico e metricas apenas do proprio motorista autenticado', async () => {
    await request(app.getHttpServer())
      .get('/deliveries/me/history')
      .set('x-test-user-role', TipoUsuario.MOTORISTA)
      .set('x-test-user-id', '77')
      .expect(200)
      .expect({
        items: [
          {
            id: 4,
            driverId: 701,
            destinationAddress: 'Rua D',
            status: StatusEntrega.CANCELADO,
          },
          {
            id: 3,
            driverId: 701,
            destinationAddress: 'Rua C',
            status: StatusEntrega.ENTREGUE,
          },
        ],
        metrics: {
          totalConcluidas: 1,
          totalEmRota: 1,
          totalCanceladas: 1,
          taxaConclusao: 25,
        },
      });
  });

  it('retorna 404 quando o usuario motorista nao possui perfil de motorista vinculado', async () => {
    await request(app.getHttpServer())
      .get('/deliveries/me')
      .set('x-test-user-role', TipoUsuario.MOTORISTA)
      .set('x-test-user-id', '999')
      .expect(404);
  });

  it('inicia a entrega do proprio motorista autenticado', async () => {
    await request(app.getHttpServer())
      .patch('/deliveries/1/start')
      .set('x-test-user-role', TipoUsuario.MOTORISTA)
      .set('x-test-user-id', '77')
      .send({ latitudeInicio: -23.5, longitudeInicio: -46.6 })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: 1,
          driverId: 701,
          destinationAddress: 'Rua A',
          status: StatusEntrega.EM_ROTA,
          latitudeInicio: -23.5,
          longitudeInicio: -46.6,
        });
        expect(body.dataHoraInicio).toEqual(expect.any(String));
      });
  });

  it('retorna 404 ao tentar iniciar entrega de outro motorista', async () => {
    await request(app.getHttpServer())
      .patch('/deliveries/5/start')
      .set('x-test-user-role', TipoUsuario.MOTORISTA)
      .set('x-test-user-id', '77')
      .send({ latitudeInicio: -23.5, longitudeInicio: -46.6 })
      .expect(404);
  });

  it('finaliza entrega em rota do proprio motorista e atualiza status para entregue', async () => {
    await request(app.getHttpServer())
      .post('/finalizations')
      .set('x-test-user-role', TipoUsuario.MOTORISTA)
      .set('x-test-user-id', '77')
      .send({
        deliveryId: 2,
        receiverName: 'Maria',
        signature: 'assinatura-mobile',
        latitude: -23.5,
        longitude: -46.6,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: 1,
          deliveryId: 2,
          receiverName: 'Maria',
          receiverDocument: '',
          receiverRelation: '',
          photoUrl: '',
          signatureUrl: 'assinatura-mobile',
          latitude: -23.5,
          longitude: -46.6,
          finalizedAt: '2026-01-01T10:00:00.000Z',
        });
      });

    expect(
      deliveriesFixture.find((delivery) => delivery.id === 2)?.status,
    ).toBe(StatusEntrega.ENTREGUE);
  });

  it('retorna 404 ao tentar finalizar entrega de outro motorista', async () => {
    await request(app.getHttpServer())
      .post('/finalizations')
      .set('x-test-user-role', TipoUsuario.MOTORISTA)
      .set('x-test-user-id', '77')
      .send({
        deliveryId: 5,
        receiverName: 'Maria',
        signature: 'assinatura-mobile',
        latitude: -23.5,
        longitude: -46.6,
      })
      .expect(404);
  });

  it('retorna 400 quando o payload mobile de finalização não envia signature', async () => {
    await request(app.getHttpServer())
      .post('/finalizations')
      .set('x-test-user-role', TipoUsuario.MOTORISTA)
      .set('x-test-user-id', '77')
      .send({
        deliveryId: 2,
        receiverName: 'Maria',
        latitude: -23.5,
        longitude: -46.6,
      })
      .expect(400);
  });

  it('retorna 400 quando o payload mobile de finalização não envia latitude', async () => {
    await request(app.getHttpServer())
      .post('/finalizations')
      .set('x-test-user-role', TipoUsuario.MOTORISTA)
      .set('x-test-user-id', '77')
      .send({
        deliveryId: 2,
        receiverName: 'Maria',
        signature: 'assinatura-mobile',
        longitude: -46.6,
      })
      .expect(400);
  });

  it('retorna 400 quando o payload mobile de finalização não envia longitude', async () => {
    await request(app.getHttpServer())
      .post('/finalizations')
      .set('x-test-user-role', TipoUsuario.MOTORISTA)
      .set('x-test-user-id', '77')
      .send({
        deliveryId: 2,
        receiverName: 'Maria',
        signature: 'assinatura-mobile',
        latitude: -23.5,
      })
      .expect(400);
  });
});

function buildDeliveriesFixture() {
  return [
    {
      id: 1,
      driverId: 701,
      destinationAddress: 'Rua A',
      status: StatusEntrega.AGUARDANDO_MOTORISTA,
    },
    {
      id: 2,
      driverId: 701,
      destinationAddress: 'Rua B',
      status: StatusEntrega.EM_ROTA,
    },
    {
      id: 3,
      driverId: 701,
      destinationAddress: 'Rua C',
      status: StatusEntrega.ENTREGUE,
    },
    {
      id: 4,
      driverId: 701,
      destinationAddress: 'Rua D',
      status: StatusEntrega.CANCELADO,
    },
    {
      id: 5,
      driverId: 880,
      destinationAddress: 'Rua E',
      status: StatusEntrega.AGUARDANDO_MOTORISTA,
    },
    {
      id: 6,
      driverId: 880,
      destinationAddress: 'Rua F',
      status: StatusEntrega.ENTREGUE,
    },
  ];
}

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: Number(request.headers['x-test-user-id'] ?? 77),
      email: 'motorista@test.com',
      tipoUsuario: request.headers['x-test-user-role'] ?? TipoUsuario.ADMIN,
    };

    return true;
  }
}

@Module({
  controllers: [DeliveriesController, FinalizationsController],
  providers: [
    DeliveriesService,
    FinalizationsService,
    MobileDriverGuard,
    {
      provide: getRepositoryToken(Delivery),
      useValue: mockRepository,
    },
    {
      provide: getRepositoryToken(Company),
      useValue: mockCompanyRepository,
    },
    {
      provide: getRepositoryToken(Driver),
      useValue: mockDriverRepository,
    },
    {
      provide: getRepositoryToken(Finalization),
      useValue: mockFinalizationsRepository,
    },
    {
      provide: UsersService,
      useValue: mockUsersService,
    },
    {
      provide: DataSource,
      useValue: mockDataSource,
    },
    {
      provide: DeliveryProofEmailsService,
      useValue: mockProofEmailsService,
    },
  ],
})
class MobileDriverDeliveriesHarnessModule {}
