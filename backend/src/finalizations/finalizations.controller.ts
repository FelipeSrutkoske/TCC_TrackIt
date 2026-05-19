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
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@UseGuards(JwtAuthGuard)
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
  findAll() {
    return this.finalizationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.finalizationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateFinalizationDto) {
    return this.finalizationsService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.finalizationsService.remove(+id);
  }
}
