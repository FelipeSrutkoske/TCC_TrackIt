import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FinalizationsService } from './finalizations.service';
import { CreateFinalizationDto } from './dto/create-finalization.dto';
import { UpdateFinalizationDto } from './dto/update-finalization.dto';

@Controller('finalizations')
export class FinalizationsController {
  constructor(private readonly finalizationsService: FinalizationsService) {}

  @Post()
  create(@Body() createFinalizationDto: CreateFinalizationDto) {
    return this.finalizationsService.create(createFinalizationDto);
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
  update(@Param('id') id: string, @Body() updateFinalizationDto: UpdateFinalizationDto) {
    return this.finalizationsService.update(+id, updateFinalizationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.finalizationsService.remove(+id);
  }
}
