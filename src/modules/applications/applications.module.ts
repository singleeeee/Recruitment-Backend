import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApplicationController } from './controllers/application.controller';
import { ApplicationService } from './services/application.service';
import { AiEvaluationService } from './services/ai-evaluation.service';

@Module({
  imports: [PrismaModule],
  controllers: [ApplicationController],
  providers: [ApplicationService, AiEvaluationService],
  exports: [ApplicationService, AiEvaluationService],
})
export class ApplicationsModule {}
