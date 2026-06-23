import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Company,
  CompanySubscriptionStatus,
} from '../deliveries/entities/company.entity';
import { Delivery, StatusEntrega } from '../deliveries/entities/delivery.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import type { CompanyScope } from '../common/company-scope';
import { isValidCnpj, onlyDigits } from '../common/validators/br-documents';

interface CompanyAnalytics {
  totalDeliveries: number;
  completionRate: number;
  occurrences: number;
  delayedDeliveries: number;
  gpsDivergent: number;
  lastDeliveryAt: string | null;
}

export interface CompanyWithAnalytics extends Company {
  analytics: CompanyAnalytics;
}

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  async create(data: CreateCompanyDto): Promise<Company> {
    const cnpj = onlyDigits(data.cnpj ?? '');

    if (!isValidCnpj(cnpj)) {
      throw new BadRequestException('Informe um CNPJ valido.');
    }

    const company = this.companiesRepository.create({
      corporateName: data.corporateName.trim(),
      tradeName: data.tradeName?.trim() || data.corporateName.trim(),
      cnpj,
      situacaoCnpj: data.situacaoCnpj?.trim() || undefined,
      cnaePrincipal: data.cnaePrincipal?.trim() || undefined,
      porte: data.porte?.trim() || undefined,
      contactEmail: data.contactEmail ?? undefined,
      phone: onlyDigits(data.phone ?? '') || undefined,
      cep: onlyDigits(data.cep ?? '') || undefined,
      logradouro: data.logradouro?.trim() || undefined,
      numero: data.numero?.trim() || undefined,
      complemento: data.complemento?.trim() || undefined,
      bairro: data.bairro?.trim() || undefined,
      municipio: data.municipio?.trim() || undefined,
      uf: data.uf?.trim().toUpperCase() || undefined,
      subscriptionStatus:
        data.subscriptionStatus ?? CompanySubscriptionStatus.ATIVO,
      registeredAt: new Date(),
    });

    const savedCompany = await this.companiesRepository.save(company);

    this.logger.log(
      `Empresa criada id=${savedCompany.id} cnpj=${savedCompany.cnpj} nome=${savedCompany.corporateName}`,
    );

    return savedCompany;
  }

  findAll(scope?: CompanyScope): Promise<Company[]> {
    return this.companiesRepository.find({
      where: {
        ...(this.getScopedCompanyWhere(scope) ?? {}),
        subscriptionStatus: CompanySubscriptionStatus.ATIVO,
      },
      order: { corporateName: 'ASC' },
    });
  }

  async findAllWithAnalytics(scope?: CompanyScope): Promise<CompanyWithAnalytics[]> {
    const scopedWhere = this.getScopedCompanyWhere(scope);
    const companies = await this.companiesRepository.find({
      ...(scopedWhere ? { where: scopedWhere } : {}),
      relations: [
        'deliveries',
        'deliveries.occurrences',
        'deliveries.finalization',
        'deliveries.driver',
        'deliveries.driver.user',
      ],
      order: { corporateName: 'ASC' },
    });

    return companies.map((company) => this.withAnalytics(company));
  }

  async findAnalytics(id: number, scope?: CompanyScope): Promise<CompanyWithAnalytics> {
    const scopedWhere = this.getScopedCompanyWhere(scope);
    const company = await this.companiesRepository.findOne({
      where: scopedWhere ?? { id },
      relations: [
        'deliveries',
        'deliveries.occurrences',
        'deliveries.finalization',
        'deliveries.driver',
        'deliveries.driver.user',
      ],
    });

    if (!company) {
      throw new NotFoundException(`Empresa #${id} nao encontrada`);
    }

    return this.withAnalytics(company);
  }

  private getScopedCompanyWhere(scope?: CompanyScope): { id: number } | null {
    if (!scope || scope.isGlobal || !scope.companyId) {
      return null;
    }

    return { id: scope.companyId };
  }

  private withAnalytics(company: Company): CompanyWithAnalytics {
    const deliveries = this.withDeliverySequences(company.deliveries ?? []);
    const completed = deliveries.filter(
      (delivery) => delivery.status === StatusEntrega.ENTREGUE,
    );
    const delayedDeliveries = deliveries.filter(
      (delivery) => this.isDelayed(delivery),
    );
    const lastDeliveryAt = deliveries
      .map((delivery) => this.toDate(delivery.createdAt))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      ...company,
      deliveries,
      analytics: {
        totalDeliveries: deliveries.length,
        completionRate: this.percentage(completed.length, deliveries.length),
        occurrences: deliveries.reduce(
          (total, delivery) => total + (delivery.occurrences?.length ?? 0),
          0,
        ),
        delayedDeliveries: delayedDeliveries.length,
        gpsDivergent: deliveries.filter(
          (delivery) => delivery.finalization?.gpsDivergente,
        ).length,
        lastDeliveryAt: lastDeliveryAt?.toISOString() ?? null,
      },
    };
  }

  private withDeliverySequences(deliveries: Delivery[]): Delivery[] {
    return [...deliveries]
      .sort((a, b) => a.id - b.id)
      .map((delivery, index) => Object.assign(delivery, { companySequence: index + 1 }));
  }

  private isDelayed(delivery: Delivery): boolean {
    const estimate = this.toDate(delivery.deliveryEstimate);
    const finalizedAt = this.toDate(delivery.finalization?.finalizedAt);

    return Boolean(estimate && finalizedAt && finalizedAt > estimate);
  }

  private percentage(part: number, total: number): number {
    if (total <= 0) return 0;
    return Number(((part / total) * 100).toFixed(2));
  }

  private toDate(value?: Date | string | null): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? new Date(value) : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }
}
