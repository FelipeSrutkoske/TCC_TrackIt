import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinalizationsService } from './finalizations.service';
import { FinalizationsController } from './finalizations.controller';
import { Finalization } from './entities/finalization.entity';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { MobileDriverGuard } from '../auth/mobile-driver.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Finalization]), DeliveriesModule],
  controllers: [FinalizationsController],
  providers: [FinalizationsService, MobileDriverGuard],
  exports: [FinalizationsService],
})
export class FinalizationsModule {}
