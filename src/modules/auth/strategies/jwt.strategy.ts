import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<any> { // Return type needs to be more generic to include the custom 'role' field from JWT payload
    // 从数据库获取用户信息，包括角色和动态档案字段
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        profileFields: {
          include: {
            field: true // 包含字段配置信息，以获取 fieldName
          }
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 注意：这里我们将 JWT payload 中的 'role' (其值是 role code 字符串) 直接赋给 user 对象
    // RolesGuard 将检查这个 `user.role` 属性
    // `user.roleId` 是从数据库获取的 Role 表的主键 ID
    // 为了让RolesGuard能正常工作，需要：
    // 1. user.role 保持为字符串（用于RolesGuard权限检查）
    // 2. user.roleCode 也保存为字符串
    // 3. user.roleData 保存完整的角色对象（包含权限）
    return {
      ...user,
      role: payload.role, // 保持为字符串用于RolesGuard
      roleCode: payload.role, // 别名
      roleData: user.role, // 完整的角色对象包含权限
    };
  }
}