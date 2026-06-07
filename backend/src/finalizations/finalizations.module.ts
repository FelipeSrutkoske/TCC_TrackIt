import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinalizationsService } from './finalizations.service';
import { FinalizationsController } from './finalizations.controller';
import { Finalization } from './entities/finalization.entity';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { MobileDriverGuard } from '../auth/mobile-driver.guard';
import { DeliveryProofEmailsModule } from '../proof-emails/proof-emails.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Finalization]),
    DeliveriesModule,
    DeliveryProofEmailsModule,
  ],
  controllers: [FinalizationsController],
  providers: [FinalizationsService, MobileDriverGuard],
  exports: [FinalizationsService],
})
export class FinalizationsModule {}
