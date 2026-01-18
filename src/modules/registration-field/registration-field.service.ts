import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationFieldDto } from './dto/create-registration-field.dto';
import { UpdateRegistrationFieldDto } from './dto/update-registration-field.dto';

@Injectable()
export class RegistrationFieldService {
  constructor(private prisma: PrismaService) {}

  async create(createRegistrationFieldDto: CreateRegistrationFieldDto) {
    return this.prisma.registrationField.create({
      data: createRegistrationFieldDto,
    });
  }

  async findAll() {
    return this.prisma.registrationField.findMany();
  }

  async findOne(id: string) {
    const field = await this.prisma.registrationField.findUnique({
      where: { id },
    });
    if (!field) {
      throw new NotFoundException(`RegistrationField with ID ${id} not found`);
    }
    return field;
  }

  async update(id: string, updateRegistrationFieldDto: UpdateRegistrationFieldDto) {
    await this.findOne(id); // Check existence first
    return this.prisma.registrationField.update({
      where: { id },
      data: updateRegistrationFieldDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence first
    return this.prisma.registrationField.delete({
      where: { id },
    });
  }

  /**
   * 公开的 API，获取所有启用的注册字段配置
   */
  async findAllActive() {
    return this.prisma.registrationField.findMany({
      where: { isActive: true },
      orderBy: { fieldOrder: 'asc' }, // 按排序字段升序返回
    });
  }
}
