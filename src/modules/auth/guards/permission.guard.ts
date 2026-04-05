import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 读取接口或 Controller 上标注的所需权限
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 没有标注权限要求，直接放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    const userPermissions = user.permissions ?? [];

    // 检查是否拥有所有所需权限（AND 逻辑）
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      const missing = requiredPermissions.filter((p) => !userPermissions.includes(p));
      throw new ForbiddenException(`权限不足，缺少：${missing.join(', ')}`);
    }

    return true;
  }
}
