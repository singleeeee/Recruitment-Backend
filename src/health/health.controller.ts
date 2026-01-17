import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../modules/prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: '系统健康检查',
    description: '检查数据库连接和应用状态',
  })
  @ApiResponse({
    status: 200,
    description: '系统运行正常',
    schema: {
      example: {
        status: 'ok',
        database: 'connected',
        timestamp: '2026-01-17T07:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '数据库连接失败',
    schema: {
      example: {
        status: 'error',
        database: 'disconnected',
        error: 'Connection failed',
        timestamp: '2026-01-17T07:30:00.000Z',
      },
    },
  })
  async check() {
    // 检查数据库连接
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
