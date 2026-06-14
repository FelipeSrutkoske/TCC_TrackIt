import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SendProofEmailDto } from './dto/send-proof-email.dto';
import { DeliveryProofEmailsService } from './proof-emails.service';
import { TipoUsuario } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deliveries/:deliveryId/proof-emails')
export class DeliveryProofEmailsController {
  constructor(
    private readonly proofEmailsService: DeliveryProofEmailsService,
  ) {}

  @Get()
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  findByDelivery(@Param('deliveryId') deliveryId: string) {
    return this.proofEmailsService.findByDelivery(+deliveryId);
  }

  @Post()
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  send(
    @Param('deliveryId') deliveryId: string,
    @Body() body: SendProofEmailDto,
  ) {
    return this.proofEmailsService.sendDeliveryProof(+deliveryId, body.email);
  }
}
