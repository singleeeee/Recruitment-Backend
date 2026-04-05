import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { ApplicationController } from './controllers/application.controller';
import { ApplicationService } from './services/application.service';
import { AiEvaluationService } from './services/ai-evaluation.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [ApplicationController],
  providers: [ApplicationService, AiEvaluationService],
  exports: [ApplicationService, AiEvaluationService],
})
export class ApplicationsModule {}
