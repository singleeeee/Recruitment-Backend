import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: '用户注册',
    description: '创建新用户账户',
  })
  @ApiBody({
    type: RegisterDto,
    description: '用户注册信息',
    examples: {
      example1: {
        summary: '候选人注册示例',
        value: {
          email: 'candidate@example.com',
          password: 'password123',
          name: '张三',
          studentId: '2021001001',
          college: '计算机学院',
          major: '计算机科学与技术',
          grade: '2021级',
          phone: '13800138000',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '注册成功',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '邮箱或学号已存在',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({
    summary: '用户登录',
    description: '使用邮箱和密码登录',
  })
  @ApiBody({
    type: LoginDto,
    description: '登录凭据',
    examples: {
      example1: {
        summary: '登录示例',
        value: {
          email: 'candidate@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '邮箱或密码错误',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '刷新访问令牌',
    description: '使用刷新令牌获取新的访问令牌',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: '刷新令牌',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '令牌刷新成功',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '刷新令牌无效或已过期',
  })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登出',
    description: '用户登出（客户端需要清除存储的令牌）',
  })
  @ApiResponse({
    status: 200,
    description: '登出成功',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '登出成功',
        },
      },
    },
  })
  async logout() {
    return this.authService.logout();
  }
}