import { Injectable } from '@nestjs/common';
import { CreateFinalizationDto } from './dto/create-finalization.dto';
import { UpdateFinalizationDto } from './dto/update-finalization.dto';

@Injectable()
export class FinalizationsService {
  create(createFinalizationDto: CreateFinalizationDto) {
    return 'This action adds a new finalization';
  }

  findAll() {
    return `This action returns all finalizations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} finalization`;
  }

  update(id: number, updateFinalizationDto: UpdateFinalizationDto) {
    return `This action updates a #${id} finalization`;
  }

  remove(id: number) {
    return `This action removes a #${id} finalization`;
  }
}
