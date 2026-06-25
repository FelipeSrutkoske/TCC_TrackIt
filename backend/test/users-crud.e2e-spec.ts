import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { Driver } from '../src/users/entities/driver.entity';
import { TipoUsuario, User } from '../src/users/entities/user.entity';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

const users = new Map<number, any>();
let nextId = 2;

const mockRepository = {
  create: jest.fn((data: any) => data),
  save: jest.fn(async (data: any) => {
    const id = data.id ?? nextId++;
    const user = {
      ...(users.get(id) ?? {}),
      ...data,
      id,
    };
    users.set(id, user);

    return user;
  }),
  find: jest.fn(async (options?: any) => {
    const companyId = options?.where?.companyId;
    const allUsers = Array.from(users.values());

    if (!companyId) {
      return allUsers;
    }

    return allUsers.filter((user) => user.companyId === companyId);
  }),
  findOne: jest.fn(async (options: any) => {
    const id = options?.where?.id;
    return users.get(id) ?? null;
  }),
  remove: jest.fn(async (user: any) => {
    users.delete(user.id);
  }),
  createQueryBuilder: jest.fn(),
};

const mockDriverRepository = {
  create: jest.fn((data: any) => data),
  save: jest.fn(async (data: any) => ({ id: 70, ...data })),
};

describe('Users CRUD (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersCrudHarnessModule],
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

  beforeEach(() => {
    resetUsers();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('cria usuario via POST /users sem retornar senha', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        nome: 'Novo Usuario',
        email: 'novo.usuario@test.com',
        senha: 'segredo123',
        tipoUsuario: TipoUsuario.ADMIN,
        ativo: true,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: 2,
          nome: 'Novo Usuario',
          email: 'novo.usuario@test.com',
          tipoUsuario: TipoUsuario.ADMIN,
          ativo: true,
        });
        expect(response.body).not.toHaveProperty('senha');
      });

    expect(mockRepository.create).toHaveBeenCalledWith({
      nome: 'Novo Usuario',
      email: 'novo.usuario@test.com',
      senha: expect.any(String),
      tipoUsuario: TipoUsuario.ADMIN,
      ativo: true,
      companyId: null,
    });
    expect(users.has(2)).toBe(true);
    expect(users.get(2)?.senha).toEqual(expect.any(String));
  });

  it('dashboard cria motorista sempre na propria empresa', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('x-test-user-role', TipoUsuario.DASHBOARD)
      .set('x-test-company-id', '1')
      .send({
        nome: 'Motorista Dashboard',
        email: 'motorista.dashboard@test.com',
        senha: 'segredo123',
        tipoUsuario: TipoUsuario.MOTORISTA,
        companyId: 99,
        driverProfile: {
          cnh: '12345678900',
        },
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: 2,
          nome: 'Motorista Dashboard',
          tipoUsuario: TipoUsuario.MOTORISTA,
          companyId: 1,
        });
        expect(response.body).not.toHaveProperty('senha');
      });

    expect(users.get(2)?.companyId).toBe(1);
  });

  it('retorna 403 quando dashboard tenta criar admin', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('x-test-user-role', TipoUsuario.DASHBOARD)
      .set('x-test-company-id', '1')
      .send({
        nome: 'Admin Indevido',
        email: 'admin.indevido@test.com',
        senha: 'segredo123',
        tipoUsuario: TipoUsuario.ADMIN,
      })
      .expect(403);

    expect(users.has(2)).toBe(false);
  });

  it('retorna 400 ao criar usuario dashboard sem empresa', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        nome: 'Dashboard Sem Empresa',
        email: 'dashboard.sem.empresa@test.com',
        senha: 'segredo123',
        tipoUsuario: TipoUsuario.DASHBOARD,
      })
      .expect(400);

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(users.has(2)).toBe(false);
  });

  it('retorna 400 ao criar usuario sem tipo', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        nome: 'Usuario Sem Tipo',
        email: 'usuario.sem.tipo@test.com',
        senha: 'segredo123',
      })
      .expect(400);

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(users.has(2)).toBe(false);
  });

  it('cria usuario dashboard com empresa', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        nome: 'Dashboard Com Empresa',
        email: 'dashboard.com.empresa@test.com',
        senha: 'segredo123',
        tipoUsuario: TipoUsuario.DASHBOARD,
        companyId: 1,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: 2,
          nome: 'Dashboard Com Empresa',
          email: 'dashboard.com.empresa@test.com',
          tipoUsuario: TipoUsuario.DASHBOARD,
          companyId: 1,
        });
        expect(response.body).not.toHaveProperty('senha');
      });

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(users.get(2)?.companyId).toBe(1);
  });

  it('cria motorista com perfil em tb_motoristas', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        nome: 'Motorista Novo',
        email: 'motorista.novo@test.com',
        senha: 'segredo123',
        tipoUsuario: TipoUsuario.MOTORISTA,
        companyId: 1,
        driverProfile: {
          cnh: '12345678900',
          placaVeiculo: 'ABC1D23',
          tipoVeiculo: 'Van',
        },
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: 2,
          nome: 'Motorista Novo',
          tipoUsuario: TipoUsuario.MOTORISTA,
          companyId: 1,
          driverProfile: {
            id: 70,
            userId: 2,
            cnh: '12345678900',
            placaVeiculo: 'ABC1D23',
            tipoVeiculo: 'Van',
            disponivel: true,
          },
        });
        expect(response.body).not.toHaveProperty('senha');
      });

    expect(mockDriverRepository.create).toHaveBeenCalledWith({
      userId: 2,
      cnh: '12345678900',
      placaVeiculo: 'ABC1D23',
      tipoVeiculo: 'Van',
      disponivel: true,
    });
    expect(mockDriverRepository.save).toHaveBeenCalled();
  });

  it('retorna 400 ao criar motorista com perfil invalido', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        nome: 'Motorista Perfil Invalido',
        email: 'motorista.perfil.invalido@test.com',
        senha: 'segredo123',
        tipoUsuario: TipoUsuario.MOTORISTA,
        companyId: 1,
        driverProfile: {
          cnh: '12345678900',
          placaVeiculo: 'ABCDEF12345',
        },
      })
      .expect(400);

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(mockDriverRepository.save).not.toHaveBeenCalled();
    expect(users.has(2)).toBe(false);
  });

  it('lista usuarios via GET /users sem retornar senha', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual([
          {
            id: 1,
            nome: 'Usuario Existente',
            email: 'existente@test.com',
            tipoUsuario: TipoUsuario.DASHBOARD,
            ativo: true,
            companyId: 1,
            driverProfile: { id: 51 },
          },
        ]);
        expect(response.body[0]).not.toHaveProperty('senha');
      });

    expect(mockRepository.find).toHaveBeenCalledTimes(1);
  });

  it('dashboard lista apenas usuarios da propria empresa', async () => {
    users.set(2, {
      id: 2,
      nome: 'Usuario Outra Empresa',
      email: 'outra.empresa@test.com',
      senha: 'hashed_senha',
      tipoUsuario: TipoUsuario.DASHBOARD,
      ativo: true,
      companyId: 99,
    });

    await request(app.getHttpServer())
      .get('/users')
      .set('x-test-user-role', TipoUsuario.DASHBOARD)
      .set('x-test-company-id', '1')
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body.every((user: any) => user.companyId === 1)).toBe(true);
        expect(response.body[0]).not.toHaveProperty('senha');
      });

    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { companyId: 1 },
      relations: ['driverProfile', 'company'],
    });
  });

  it('retorna usuario via GET /users/:id sem retornar senha', async () => {
    await request(app.getHttpServer())
      .get('/users/1')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          id: 1,
          nome: 'Usuario Existente',
          email: 'existente@test.com',
          tipoUsuario: TipoUsuario.DASHBOARD,
          ativo: true,
          companyId: 1,
          driverProfile: { id: 51 },
        });
        expect(response.body).not.toHaveProperty('senha');
      });

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['driverProfile'],
    });
  });

  it('atualiza campos via PATCH /users/:id sem retornar senha', async () => {
    await request(app.getHttpServer())
      .patch('/users/1')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        nome: 'Usuario Atualizado',
        ativo: false,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          id: 1,
          nome: 'Usuario Atualizado',
          email: 'existente@test.com',
          tipoUsuario: TipoUsuario.DASHBOARD,
          ativo: false,
          companyId: 1,
          driverProfile: { id: 51 },
        });
        expect(response.body).not.toHaveProperty('senha');
      });

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        nome: 'Usuario Atualizado',
        ativo: false,
      }),
    );
    expect(users.get(1)?.nome).toBe('Usuario Atualizado');
  });

  it('atualiza acesso operacional com email status e senha via PATCH /users/:id', async () => {
    await request(app.getHttpServer())
      .patch('/users/1')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        email: 'operador.atualizado@test.com',
        senha: 'nova-senha-123',
        ativo: false,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: 1,
          email: 'operador.atualizado@test.com',
          ativo: false,
        });
        expect(response.body).not.toHaveProperty('senha');
      });

    expect(users.get(1)?.email).toBe('operador.atualizado@test.com');
    expect(users.get(1)?.ativo).toBe(false);
    expect(users.get(1)?.senha).not.toBe('nova-senha-123');
  });

  it('retorna 403 ao tentar alterar acesso ADMIN', async () => {
    users.set(3, {
      id: 3,
      nome: 'Admin Master',
      email: 'admin.master@test.com',
      senha: 'hashed_senha',
      tipoUsuario: TipoUsuario.ADMIN,
      ativo: true,
      companyId: null,
    });

    await request(app.getHttpServer())
      .patch('/users/3')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({ email: 'admin.alterado@test.com' })
      .expect(403);

    expect(users.get(3)?.email).toBe('admin.master@test.com');
  });

  it('retorna 403 ao tentar alterar usuario sem papel admin', async () => {
    await request(app.getHttpServer())
      .patch('/users/1')
      .set('x-test-user-role', TipoUsuario.DASHBOARD)
      .send({ tipoUsuario: TipoUsuario.ADMIN })
      .expect(403);

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(users.get(1)?.tipoUsuario).toBe(TipoUsuario.DASHBOARD);
  });

  it('remove usuario via DELETE /users/:id', async () => {
    await request(app.getHttpServer())
      .delete('/users/1')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .expect(200);

    expect(mockRepository.remove).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
    );
    expect(users.has(1)).toBe(false);
  });
});

function resetUsers() {
  users.clear();
  users.set(1, {
    id: 1,
    nome: 'Usuario Existente',
    email: 'existente@test.com',
    senha: 'hashed_senha',
    tipoUsuario: TipoUsuario.DASHBOARD,
    ativo: true,
    companyId: 1,
    driverProfile: { id: 51 },
  });
  nextId = 2;
}

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const role = request.headers['x-test-user-role'] ?? TipoUsuario.ADMIN;
    request.user = {
      id: 99,
      email: 'admin@test.com',
      tipoUsuario: role,
      companyId: request.headers['x-test-company-id']
        ? Number(request.headers['x-test-company-id'])
        : null,
    };

    return true;
  }
}

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    RolesGuard,
    Reflector,
    {
      provide: getRepositoryToken(User),
      useValue: mockRepository,
    },
    {
      provide: getRepositoryToken(Driver),
      useValue: mockDriverRepository,
    },
  ],
})
class UsersCrudHarnessModule {}
