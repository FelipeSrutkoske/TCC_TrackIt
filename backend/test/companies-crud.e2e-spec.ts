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
import { CompaniesController } from '../src/companies/companies.controller';
import { CompaniesDataService } from '../src/companies/companiesData.service';
import { CompaniesService } from '../src/companies/companies.service';
import { Company } from '../src/deliveries/entities/company.entity';
import { TipoUsuario } from '../src/users/entities/user.entity';

const companies = new Map<number, any>();
let nextId = 2;

const mockRepository = {
  create: jest.fn((data: any) => data),
  save: jest.fn(async (data: any) => {
    const id = data.id ?? nextId++;
    const company = {
      ...(companies.get(id) ?? {}),
      ...data,
      id,
    };
    companies.set(id, company);

    return company;
  }),
  find: jest.fn(async (options?: any) => {
    const where = options?.where ?? {};
    const allCompanies = Array.from(companies.values());

    return allCompanies.filter((company) => {
      if (where.id !== undefined && company.id !== where.id) {
        return false;
      }

      if (
        where.subscriptionStatus !== undefined &&
        company.subscriptionStatus !== where.subscriptionStatus
      ) {
        return false;
      }

      return true;
    });
  }),
  findOne: jest.fn(async (options: any) => {
    const id = options?.where?.id;
    return companies.get(id) ?? null;
  }),
  remove: jest.fn(async (company: any) => {
    companies.delete(company.id);
  }),
  createQueryBuilder: jest.fn(),
};

// mock de retorno completo da BrasilAPI para CNPJ valido
const mockBrasilApiResponse = {
  razao_social: 'EMPRESA E2E LTDA',
  nome_fantasia: 'Empresa E2E',
  descricao_situacao_cadastral: 'ATIVA',
  cnae_fiscal_descricao: 'Desenvolvimento de software',
  descricao_porte: 'DEMAIS',
  cep: '80010000',
  logradouro: 'Rua XV de Piracicaba',
  numero: '102',
  complemento: 'Sala 3',
  bairro: 'Lar Parana',
  municipio: 'Campo Mourao',
  uf: 'pr',
  ddd_telefone_1: '44999999999',
  email: 'contato@e2e.com',
};

describe('Companies CRUD (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CompaniesCrudHarnessModule],
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
    resetCompanies();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('cria empresa via POST /companies com CNPJ valido', async () => {
    await request(app.getHttpServer())
      .post('/companies')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        corporateName: 'Empresa E2E LTDA',
        tradeName: 'Empresa E2E',
        cnpj: '11.222.333/0001-81',
        situacaoCnpj: 'ATIVA',
        cnaePrincipal: 'Desenvolvimento de software',
        porte: 'DEMAIS',
        contactEmail: 'contato@e2e.com',
        phone: '(44) 99999-9999',
        cep: '80010-000',
        logradouro: 'Rua XV de Piracicaba',
        numero: '102',
        complemento: 'Sala 3',
        bairro: 'Lar Parana',
        municipio: 'Campo Mourao',
        uf: 'PR',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: 2,
          corporateName: 'Empresa E2E LTDA',
          tradeName: 'Empresa E2E',
          cnpj: '11222333000181', // salvo sem mascara
          situacaoCnpj: 'ATIVA',
          cnaePrincipal: 'Desenvolvimento de software',
          porte: 'DEMAIS',
          contactEmail: 'contato@e2e.com',
          phone: '44999999999', // telefone sem digitos nao numericos
          cep: '80010000',
          logradouro: 'Rua XV de Piracicaba',
          numero: '102',
          complemento: 'Sala 3',
          bairro: 'Lar Parana',
          municipio: 'Campo Mourao',
          uf: 'PR',
          subscriptionStatus: 'ativo',
        });
        expect(response.body).toHaveProperty('registeredAt');
      });

    expect(companies.has(2)).toBe(true);
    expect(companies.get(2).cnpj).toBe('11222333000181');
  });

  it('retorna 400 ao criar empresa com CNPJ invalido', async () => {
    await request(app.getHttpServer())
      .post('/companies')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        corporateName: 'Empresa CNPJ Invalido',
        cnpj: '00.000.000/0000-00',
      })
      .expect(400);

    expect(companies.has(2)).toBe(false);
  });

  it('retorna 400 ao criar empresa sem razao social', async () => {
    await request(app.getHttpServer())
      .post('/companies')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .send({
        cnpj: '11.222.333/0001-81',
      })
      .expect(400);

    expect(companies.has(2)).toBe(false);
  });

  it('retorna 403 quando dashboard tenta criar empresa', async () => {
    await request(app.getHttpServer())
      .post('/companies')
      .set('x-test-user-role', TipoUsuario.DASHBOARD)
      .set('x-test-company-id', '1')
      .send({
        corporateName: 'Empresa Dashboard',
        cnpj: '11.222.333/0001-81',
      })
      .expect(403);

    expect(companies.has(2)).toBe(false);
  });

  it('lista empresas ativas via GET /companies', async () => {
    await request(app.getHttpServer())
      .get('/companies')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({
          id: 1,
          corporateName: 'Empresa Existente',
          tradeName: 'Empresa Existente',
          cnpj: '11222333000181',
          subscriptionStatus: 'ativo',
        });
      });

    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { subscriptionStatus: 'ativo' },
      order: { corporateName: 'ASC' },
    });
  });

  it('dashboard lista apenas empresa propria quando informado companyId', async () => {
    companies.set(2, {
      id: 2,
      corporateName: 'Outra Empresa',
      tradeName: 'Outra Empresa',
      cnpj: '11222333000182',
      subscriptionStatus: 'ativo',
    });

    await request(app.getHttpServer())
      .get('/companies?companyId=1')
      .set('x-test-user-role', TipoUsuario.DASHBOARD)
      .set('x-test-company-id', '1')
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].id).toBe(1);
      });
  });

  it('consulta CNPJ na BrasilAPI via GET /companies/cnpj/:cnpj', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBrasilApiResponse,
    } as any);

    await request(app.getHttpServer())
      .get('/companies/cnpj/11222333000181')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          cnpj: '11.222.333/0001-81',
          corporateName: 'EMPRESA E2E LTDA',
          tradeName: 'Empresa E2E',
          situacaoCnpj: 'ATIVA',
          uf: 'PR',
          contactEmail: 'contato@e2e.com',
        });
      });
  });

  it('retorna 400 ao consultar CNPJ invalido na BrasilAPI', async () => {
    await request(app.getHttpServer())
      .get('/companies/cnpj/00000000000000')
      .set('x-test-user-role', TipoUsuario.ADMIN)
      .expect(400);
  });

  it('retorna 403 quando dashboard consulta CNPJ', async () => {
    await request(app.getHttpServer())
      .get('/companies/cnpj/11222333000181')
      .set('x-test-user-role', TipoUsuario.DASHBOARD)
      .set('x-test-company-id', '1')
      .expect(403);
  });
});

function resetCompanies() {
  companies.clear();
  companies.set(1, {
    id: 1,
    corporateName: 'Empresa Existente',
    tradeName: 'Empresa Existente',
    cnpj: '11222333000181',
    situacaoCnpj: null,
    cnaePrincipal: null,
    porte: null,
    contactEmail: null,
    phone: null,
    cep: null,
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    municipio: null,
    uf: null,
    subscriptionStatus: 'ativo',
    registeredAt: new Date('2026-01-01T10:00:00.000Z'),
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
  controllers: [CompaniesController],
  providers: [
    CompaniesService,
    CompaniesDataService,
    RolesGuard,
    Reflector,
    {
      provide: getRepositoryToken(Company),
      useValue: mockRepository,
    },
  ],
})
class CompaniesCrudHarnessModule {}
