import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OccurrencesService } from './occurrences.service';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { OccurrenceQueryDto } from './dto/occurrence-query.dto';
import { Occurrence } from './entities/occurrence.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MobileDriverGuard } from '../auth/mobile-driver.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TipoUsuario } from '../users/entities/user.entity';
import { resolveCompanyScope } from '../common/company-scope';

@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  findAll(
    @Query() query: OccurrenceQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.occurrencesService.findAllWithSummary(
      query,
      resolveCompanyScope(user, query.companyId),
    );
  }

  @Get(':id')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  findOne(@Param('id') id: string) {
    return this.occurrencesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  update(@Param('id') id: string, @Body() body: Partial<Occurrence>) {
    return this.occurrencesService.update(+id, body);
  }

  @Delete(':id')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  remove(@Param('id') id: string) {
    return this.occurrencesService.remove(+id);
  }
}
