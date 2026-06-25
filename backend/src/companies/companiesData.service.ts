import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidCnpj, onlyDigits } from '../common/validators/br-documents';
import { maskCnpj } from '../common/validators/mask-documents';

interface BrasilApiCnpjResponse {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  descricao_situacao_cadastral?: string;
  situacao_cadastral?: string | number;
  cnae_fiscal_descricao?: string;
  descricao_porte?: string;
  porte?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  email?: string;
}

export interface CompanyCnpjLookupResponse {
  cnpj: string;
  corporateName: string;
  tradeName: string;
  situacaoCnpj: string | null;
  cnaePrincipal: string | null;
  porte: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  phone: string | null;
  contactEmail: string | null;
}

@Injectable()
export class CompaniesDataService {
  async findByCnpj(cnpjInput: string): Promise<CompanyCnpjLookupResponse> {
    const cnpj = onlyDigits(cnpjInput);

    if (!isValidCnpj(cnpj)) {
      throw new BadRequestException('Informe um CNPJ valido para consulta.');
    }

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'trackit-app/1.0',
      },
    });

    if (response.status === 404) {
      throw new NotFoundException('CNPJ nao encontrado na BrasilAPI.');
    }

    if (!response.ok) {
      throw new BadGatewayException('Nao foi possivel consultar o CNPJ agora.');
    }

    const data = (await response.json()) as BrasilApiCnpjResponse;
    const corporateName = this.toText(data.razao_social);

    if (!corporateName) {
      throw new BadGatewayException('BrasilAPI retornou dados incompletos para o CNPJ.');
    }

    return {
      cnpj: maskCnpj(cnpj),
      corporateName,
      tradeName: this.toText(data.nome_fantasia) ?? corporateName,
      situacaoCnpj:
        this.toText(data.descricao_situacao_cadastral) ??
        this.toText(data.situacao_cadastral),
      cnaePrincipal: this.toText(data.cnae_fiscal_descricao),
      porte: this.toText(data.descricao_porte) ?? this.toText(data.porte),
      cep: this.toText(data.cep),
      logradouro: this.toText(data.logradouro),
      numero: this.toText(data.numero),
      complemento: this.toText(data.complemento),
      bairro: this.toText(data.bairro),
      municipio: this.toText(data.municipio),
      uf: this.toText(data.uf)?.toUpperCase() ?? null,
      phone: this.toText(data.ddd_telefone_1) ?? this.toText(data.ddd_telefone_2),
      contactEmail: this.toText(data.email)?.toLowerCase() ?? null,
    };
  }

  private toText(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();

    return text || null;
  }
}
