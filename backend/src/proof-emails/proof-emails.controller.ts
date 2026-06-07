import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendProofEmailDto } from './dto/send-proof-email.dto';
import { DeliveryProofEmailsService } from './proof-emails.service';

@UseGuards(JwtAuthGuard)
@Controller('deliveries/:deliveryId/proof-emails')
export class DeliveryProofEmailsController {
  constructor(private readonly proofEmailsService: DeliveryProofEmailsService) {}

  @Get()
  findByDelivery(@Param('deliveryId') deliveryId: string) {
    return this.proofEmailsService.findByDelivery(+deliveryId);
  }

  @Post()
  send(@Param('deliveryId') deliveryId: string, @Body() body: SendProofEmailDto) {
    return this.proofEmailsService.sendDeliveryProof(+deliveryId, body.email);
  }
}
