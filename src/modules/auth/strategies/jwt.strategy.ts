import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
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

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // 从数据库获取用户信息，包括角色和动态档案字段
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        profileFields: {
          include: {
            field: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('账号已被禁用');
    }

    // permissions 从数据库实时读取，不信任 JWT payload 里的旧值
    // 这样角色权限变更后，下次请求立即生效，无需等 Token 过期
    const permissions = (user.role?.permissions ?? []).map(
      (rp: any) => rp.permission.code as string,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      avatar: user.avatar,
      clubId: user.clubId,
      role: payload.role,
      roleCode: payload.role,
      permissions,
      roleData: user.role,
    };
  }
}
