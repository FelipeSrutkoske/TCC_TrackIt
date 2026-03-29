import { Module } from '@nestjs/common';
import { FinalizationsService } from './finalizations.service';
import { FinalizationsController } from './finalizations.controller';

@Module({
  controllers: [FinalizationsController],
  providers: [FinalizationsService],
})
export class FinalizationsModule {}
