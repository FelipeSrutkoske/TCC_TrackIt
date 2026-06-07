import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../deliveries/entities/company.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Delivery])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
