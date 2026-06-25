/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CompaniesDataService } from './companiesData.service';

// dados completos mockado da brasilApi
const mockBrasilApiResponse = {
  razao_social: 'EMPRESA TESTE LTDA',
  nome_fantasia: 'Empresa Teste',
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
  email: 'contato@teste.com',
};

describe('CompaniesDataService', () => {
  let service: CompaniesDataService;

  beforeEach(() => {
    service = new CompaniesDataService();
    jest.restoreAllMocks(); // limpa mocks entre cada teste
  });

  describe('findByCnpj', () => {
    //nao chega nem a fazer requisicao, pois CNPJ - Invalido
    it('deve retornar BadRequestException para CNPJ inválido', async () => {
      await expect(service.findByCnpj('00000000000000')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findByCnpj('123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findByCnpj('')).rejects.toThrow(BadRequestException);
    });

    // cnpj invalido mockado, para retorno 404, onde nao existe na brasilApi
    it('deve retornar NotFoundException quando CNPJ não existe na BrasilAPI', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as any);

      await expect(service.findByCnpj('85.941.112/0001-08')).rejects.toThrow(
        NotFoundException,
      );
    });

    //status 500 mockado para "simular retorno da api", causando erro
    it('deve retornar BadGatewayException quando BrasilAPI retorna erro', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as any);

      await expect(service.findByCnpj('11.222.333/0001-81')).rejects.toThrow(
        BadGatewayException,
      );
    });

    //retorno mockado sem razao social, esperado erro para a funcionalidade da tela de cadastro de cliente
    it('deve retornar BadGatewayException quando BrasilAPI retorna dados incompletos', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ razao_social: '' }), // razao_social vazia
      } as any);

      await expect(service.findByCnpj('11.222.333/0001-81')).rejects.toThrow(
        BadGatewayException,
      );
    });

    // ─── CASO 5: Fluxo feliz — tudo certo ───────────────────────────────────
    // Mockamos fetch retornando resposta completa e validamos o mapeamento
    it('deve retornar dados mapeados corretamente quando CNPJ é válido', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBrasilApiResponse,
      } as any);

      const result = await service.findByCnpj('11.222.333/0001-81');

      expect(result.cnpj).toBe('11.222.333/0001-81'); // mascara aplicada
      expect(result.corporateName).toBe('EMPRESA TESTE LTDA');
      expect(result.tradeName).toBe('Empresa Teste');
      expect(result.situacaoCnpj).toBe('ATIVA');
      expect(result.uf).toBe('PR'); // toUpperCase aplicado
      expect(result.contactEmail).toBe('contato@teste.com'); // toLowerCase aplicado
    });
  });
});
