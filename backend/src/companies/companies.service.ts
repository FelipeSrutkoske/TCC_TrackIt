import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Company,
  CompanySubscriptionStatus,
} from '../deliveries/entities/company.entity';
import { Delivery, StatusEntrega } from '../deliveries/entities/delivery.entity';

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
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  findAll(): Promise<Company[]> {
    return this.companiesRepository.find({
      where: { subscriptionStatus: CompanySubscriptionStatus.ATIVO },
      order: { corporateName: 'ASC' },
    });
  }

  async findAllWithAnalytics(): Promise<CompanyWithAnalytics[]> {
    const companies = await this.companiesRepository.find({
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

  async findAnalytics(id: number): Promise<CompanyWithAnalytics> {
    const company = await this.companiesRepository.findOne({
      where: { id },
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

  private withAnalytics(company: Company): CompanyWithAnalytics {
    const deliveries = company.deliveries ?? [];
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
