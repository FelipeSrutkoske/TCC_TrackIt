import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OccurrencesService } from './occurrences.service';
import { OccurrencesController } from './occurrences.controller';
import { Occurrence } from './entities/occurrence.entity';
import { DeliveriesModule } from '../deliveries/deliveries.module';

@Module({
  imports: [TypeOrmModule.forFeature([Occurrence]), DeliveriesModule],
  controllers: [OccurrencesController],
  providers: [OccurrencesService],
  exports: [OccurrencesService],
})
export class OccurrencesModule {}
