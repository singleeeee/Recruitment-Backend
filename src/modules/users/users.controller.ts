import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('profile')
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '获取已登录用户的个人资料',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取用户信息',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: '张三',
        role: 'candidate',
        studentId: '2021001001',
        college: '计算机学院',
        major: '计算机科学与技术',
        grade: '2021级',
        phone: '13800138000',
        avatar: null,
        createdAt: '2026-01-17T07:14:27.788Z',
        updatedAt: '2026-01-17T07:14:27.788Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  getProfile(@CurrentUser() user: Omit<User, 'passwordHash'>) {
    return user;
  }
}