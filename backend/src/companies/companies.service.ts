import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Company,
  CompanySubscriptionStatus,
} from '../deliveries/entities/company.entity';

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
}
