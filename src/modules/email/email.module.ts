import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailController } from './controllers/email.controller';
import { EmailService } from './services/email.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
