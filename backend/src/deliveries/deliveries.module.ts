import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { Delivery } from './entities/delivery.entity';
import { Company } from './entities/company.entity';
import { DeliveryDetail } from './entities/delivery-detail.entity';
import { UsersModule } from '../users/users.module';
import { MobileDriverGuard } from '../auth/mobile-driver.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, Company, DeliveryDetail]), UsersModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService, MobileDriverGuard],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
