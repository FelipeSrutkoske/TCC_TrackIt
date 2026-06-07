import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompaniesService } from './companies.service';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get('analytics')
  findAllWithAnalytics() {
    return this.companiesService.findAllWithAnalytics();
  }

  @Get(':id/analytics')
  findAnalytics(@Param('id') id: string) {
    return this.companiesService.findAnalytics(+id);
  }
}
