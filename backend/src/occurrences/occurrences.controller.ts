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
import { OccurrencesService } from './occurrences.service';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { Occurrence } from './entities/occurrence.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MobileDriverGuard } from '../auth/mobile-driver.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('occurrences')
export class OccurrencesController {
  constructor(private readonly occurrencesService: OccurrencesService) {}

  @Post()
  @UseGuards(MobileDriverGuard)
  create(
    @Body() body: CreateOccurrenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.occurrencesService.createForUser(user.id, body);
  }

  @Get()
  findAll() {
    return this.occurrencesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.occurrencesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<Occurrence>) {
    return this.occurrencesService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.occurrencesService.remove(+id);
  }
}
