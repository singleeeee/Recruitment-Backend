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
import { RegisterDto, LoginDto, LoginResponseData } from './dto/auth.dto';

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
  async register(dto: RegisterDto): Promise<LoginResponseData> {
    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 现在学号可能通过 profileFields 传递，需要检查是否已存在
    const studentId = dto.profileFields?.['studentId'];
    if (studentId) {
      // 先找到 studentId 字段配置项
      const studentIdField = await this.prisma.registrationField.findFirst({
        where: { fieldName: 'studentId' }
      });
      
      if (studentIdField) {
        // 检查是否已有用户拥有这个学号的 profileField
        const existingProfileField = await this.prisma.userProfileField.findFirst({
          where: {
            fieldValue: studentId,
            fieldId: studentIdField.id
          }
        });
        if (existingProfileField) {
          throw new ConflictException('学号已被使用');
        }
      }
    }

    try {
      // 首先查找 candidate 角色
      const candidateRole = await this.prisma.role.findUnique({
        where: { code: 'candidate' },
      });

      if (!candidateRole) {
        throw new BadRequestException('系统错误：未找到默认角色');
      }

      // 创建新用户 - 只包含核心固定字段和 roleId，所有其他字段都通过 profileFields 动态存储
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: await PasswordUtils.hashPassword(dto.password),
          name: dto.name,
          // studentId, college, major, grade, phone 等现在都作为 dynamic fields 存储
          roleId: candidateRole.id, // 关联角色ID
        },
      });

        // 处理profileFields数据，创建 UserProfileField 记录
        if (dto.profileFields && Object.keys(dto.profileFields).length > 0) {
          for (const [fieldName, fieldValue] of Object.entries(dto.profileFields)) {
            if (fieldValue) { // Only create if a value is provided
              const registrationField = await this.prisma.registrationField.findFirst({
                where: { fieldName: fieldName },
              });
              if (registrationField) {
                await this.prisma.userProfileField.create({
                  data: {
                    userId: user.id,
                    fieldId: registrationField.id, // Use fieldId from RegistrationField
                    fieldValue: fieldValue as string,
                  },
                });
              } else {
                // 配置表中没有该字段，跳过保存
              }
            }
          }
        }

      // 创建响应前，需要重新获取用户及其角色、权限和动态字段
      const userWithRelations = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
          profileFields: true,
        },
      });

      return this.createAuthResponse(userWithRelations);
    } catch (error) {
      throw new BadRequestException('注册失败，请稍后重试');
    }
  }

  /**
   * 用户登录
   */
  async login(dto: LoginDto): Promise<LoginResponseData> {
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
  ): Promise<any | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
        profileFields: true,
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await PasswordUtils.validatePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    // 检查账号状态，非 active 状态一律拒绝登录
    if (user.status !== 'active') {
      throw new UnauthorizedException(
        user.status === 'suspended' ? '账号已被封禁，请联系管理员' : '账号未激活或已被禁用',
      );
    }

    return user;
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<LoginResponseData> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
          profileFields: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('账号已被禁用，无法刷新令牌');
      }

      return this.createAuthResponse(user);
    } catch (error) {
      throw new UnauthorizedException('刷新令牌已过期或无效');
    }
  }

  /**
   * 创建认证响应
   */
  private createAuthResponse(user: any): LoginResponseData {
    // 提取权限 code 列表
    console.log('[DEBUG] role:', user.role?.code, 'permissions raw:', JSON.stringify(user.role?.permissions?.slice(0,2)));
    const permissionCodes: string[] = (user.role?.permissions ?? []).map(
      (rp: any) => rp.permission.code,
    );

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.code || 'unknown',
      permissions: permissionCodes,   // ← 权限列表写入 JWT
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret',
      expiresIn: '7d',
    });

    // Extract dynamic profile values from profileFields
    const profileFieldMap: { [key: string]: string } = {};
    if (user.profileFields) {
        user.profileFields.forEach((field: any) => {
            profileFieldMap[field.fieldName] = field.fieldValue;
        });
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role ? {
          id: user.role.id,
          name: user.role.name,
          code: user.role.code,
        } : null,
        permissions: permissionCodes,   // ← 权限列表返回给前端
        // Basic user info from User model
        avatar: user.avatar || undefined,
        status: user.status,
        // Common profile fields that might exist for different roles
        studentId: profileFieldMap['studentId'] || undefined,
        college: profileFieldMap['college'] || undefined,
        major: profileFieldMap['major'] || undefined,
        grade: profileFieldMap['grade'] || undefined,
        phone: profileFieldMap['phone'] || undefined,
        // Candidate-specific fields
        experience: profileFieldMap['experience'] || undefined,
        motivation: profileFieldMap['motivation'] || undefined,
        // Additional flexible fields can be accessed via profileFieldMap
        profileFields: profileFieldMap, // Keep the map for frontend flexibility
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