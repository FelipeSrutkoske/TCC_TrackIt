import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { Delivery } from './entities/delivery.entity';
import { UsersModule } from '../users/users.module';
import { MobileDriverGuard } from '../auth/mobile-driver.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery]), UsersModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService, MobileDriverGuard],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
