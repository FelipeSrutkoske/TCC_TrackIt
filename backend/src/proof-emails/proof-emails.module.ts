import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { DeliveryProofEmail } from './entities/delivery-proof-email.entity';
import { DeliveryProofEmailsController } from './proof-emails.controller';
import { DeliveryProofEmailsService } from './proof-emails.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryProofEmail]), DeliveriesModule],
  controllers: [DeliveryProofEmailsController],
  providers: [DeliveryProofEmailsService],
  exports: [DeliveryProofEmailsService],
})
export class DeliveryProofEmailsModule {}
