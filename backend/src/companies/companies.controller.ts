import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CompaniesService } from './companies.service';
import { CompaniesDataService } from './companiesData.service';
import { TipoUsuario } from '../users/entities/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { resolveCompanyScope } from '../common/company-scope';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly companiesDataService: CompaniesDataService,
  ) {}

  @Post()
  @Roles(TipoUsuario.ADMIN)
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    return this.companiesService.findAll(resolveCompanyScope(user, companyId));
  }

  @Get('analytics')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  findAllWithAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    return this.companiesService.findAllWithAnalytics(
      resolveCompanyScope(user, companyId),
    );
  }

  @Get('cnpj/:cnpj')
  @Roles(TipoUsuario.ADMIN)
  findByCnpj(@Param('cnpj') cnpj: string) {
    return this.companiesDataService.findByCnpj(cnpj);
  }

  @Get(':id/analytics')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  findAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companiesService.findAnalytics(+id, resolveCompanyScope(user, id));
  }
}
