import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { StartDeliveryDto } from './dto/start-delivery.dto';
import { DeliveryAnalyticsQueryDto } from './dto/delivery-analytics-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MobileDriverGuard } from '../auth/mobile-driver.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TipoUsuario } from '../users/entities/user.entity';
import { resolveCompanyScope } from '../common/company-scope';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  create(
    @Body() body: CreateDeliveryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deliveriesService.create(
      body,
      resolveCompanyScope(user, body.empresaId ?? body.companyId),
    );
  }

  @Get()
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    return this.deliveriesService.findAll(resolveCompanyScope(user, companyId));
  }

  @Get('stats')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  getStats(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    return this.deliveriesService.getStats(resolveCompanyScope(user, companyId));
  }

  @Get('analytics')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  getAnalytics(
    @Query() query: DeliveryAnalyticsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deliveriesService.getAnalytics(
      query,
      resolveCompanyScope(user, query.companyId),
    );
  }

  @Get('alerts')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  getAlerts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    return this.deliveriesService.getAlerts(resolveCompanyScope(user, companyId));
  }

  @Get('me')
  @UseGuards(MobileDriverGuard)
  getCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveriesService.findCurrentByUser(user.id);
  }

  @Get('me/history')
  @UseGuards(MobileDriverGuard)
  getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveriesService.findHistoryByUser(user.id);
  }

  @Get(':id')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    return this.deliveriesService.findOne(
      +id,
      resolveCompanyScope(user, companyId),
    );
  }

  @Patch(':id/start')
  @UseGuards(MobileDriverGuard)
  start(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: StartDeliveryDto,
  ) {
    return this.deliveriesService.startByUser(user.id, +id, body);
  }

  @Patch(':id')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  update(
    @Param('id') id: string,
    @Body() data: UpdateDeliveryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    return this.deliveriesService.update(
      +id,
      data,
      resolveCompanyScope(user, companyId ?? data.empresaId ?? data.companyId),
    );
  }

  @Delete(':id')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    return this.deliveriesService.remove(+id, resolveCompanyScope(user, companyId));
  }
}
