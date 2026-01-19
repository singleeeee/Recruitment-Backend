import { Module } from '@nestjs/common';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { PrismaService } from '../prisma/prisma.service'; // 引入 PrismaService

@Module({
  imports: [], // 如果需要从其他模块 import，请在这里添加
  controllers: [ClubController],
  providers: [ClubService, PrismaService],
  exports: [ClubService], // 如果其他模块需要使用 ClubService，请导出
})
export class ClubModule {}