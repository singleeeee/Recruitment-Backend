import { Module } from '@nestjs/common';
import { RegistrationFieldController } from './registration-field.controller';
import { RegistrationFieldService } from './registration-field.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RegistrationFieldController],
  providers: [RegistrationFieldService],
  exports: [RegistrationFieldService],
})
export class RegistrationFieldModule {}