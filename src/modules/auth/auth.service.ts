import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordUtils } from './utils/password.utils';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 用户注册
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查学号是否已存在（如果提供了学号）
    if (dto.studentId) {
      const existingStudent = await this.prisma.user.findFirst({
        where: { studentId: dto.studentId },
      });
      if (existingStudent) {
        throw new ConflictException('学号已被使用');
      }
    }

    try {
      // 创建新用户
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: await PasswordUtils.hashPassword(dto.password),
          name: dto.name,
          studentId: dto.studentId,
          college: dto.college,
          major: dto.major,
          grade: dto.grade,
          phone: dto.phone,
          role: 'candidate', // 默认为候选人角色
        },
      });

      return this.createAuthResponse(user);
    } catch (error) {
      throw new BadRequestException('注册失败，请稍后重试');
    }
  }

  /**
   * 用户登录
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    return this.createAuthResponse(user);
  }

  /**
   * 验证用户凭据
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && await PasswordUtils.validatePassword(password, user.passwordHash)) {
      return user;
    }

    return null;
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      return this.createAuthResponse(user);
    } catch (error) {
      throw new UnauthorizedException('刷新令牌已过期或无效');
    }
  }

  /**
   * 创建认证响应
   */
  private createAuthResponse(user: User): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
        studentId: user.studentId || undefined,
        college: user.college || undefined,
        major: user.major || undefined,
        grade: user.grade || undefined,
        avatar: user.avatar || undefined,
      },
    };
  }

  /**
   * 用户登出（客户端处理）
   */
  logout(): { message: string } {
    return {
      message: '登出成功',
    };
  }
}