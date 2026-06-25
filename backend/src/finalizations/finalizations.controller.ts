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
import { FinalizationsService } from './finalizations.service';
import { CreateFinalizationDto } from './dto/create-finalization.dto';
import { UpdateFinalizationDto } from './dto/update-finalization.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MobileDriverGuard } from '../auth/mobile-driver.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TipoUsuario } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finalizations')
export class FinalizationsController {
  constructor(private readonly finalizationsService: FinalizationsService) {}

  @Post()
  @UseGuards(MobileDriverGuard)
  create(
    @Body() body: CreateFinalizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.finalizationsService.createForUser(user.id, body);
  }

  @Get()
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  findAll() {
    return this.finalizationsService.findAll();
  }

  @Get(':id')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  findOne(@Param('id') id: string) {
    return this.finalizationsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  update(@Param('id') id: string, @Body() body: UpdateFinalizationDto) {
    return this.finalizationsService.update(+id, body);
  }

  @Delete(':id')
  @Roles(TipoUsuario.ADMIN, TipoUsuario.DASHBOARD)
  remove(@Param('id') id: string) {
    return this.finalizationsService.remove(+id);
  }
}
