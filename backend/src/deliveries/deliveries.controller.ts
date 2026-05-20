import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MobileDriverGuard } from '../auth/mobile-driver.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  create(@Body() body: CreateDeliveryDto) {
    return this.deliveriesService.create(body);
  }

  @Get()
  findAll() {
    return this.deliveriesService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.deliveriesService.getStats();
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
  findOne(@Param('id') id: string) {
    return this.deliveriesService.findOne(+id);
  }

  @Patch(':id/start')
  @UseGuards(MobileDriverGuard)
  start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveriesService.startByUser(user.id, +id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateDeliveryDto) {
    // A lógica de motoristaId foi movida para o service para termos controllers mais limpos.
    return this.deliveriesService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deliveriesService.remove(+id);
  }
}
