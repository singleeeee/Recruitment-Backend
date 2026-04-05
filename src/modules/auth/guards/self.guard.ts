import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export const SELF_RESOURCE_KEY = 'selfResource';

/**
 * 标注某个接口需要"只能访问自己的资源"
 * 管理员（拥有 user_read 权限）可以绕过此限制
 *
 * @param paramName URL 参数名，默认 'userId'，用于从路由参数中取目标用户 ID
 *
 * @example
 * // GET /users/:userId/applications
 * @SelfOnly()                    // 默认取 :userId
 * @SelfOnly('id')                // 取 :id
 */
export const SelfOnly = (paramName = 'userId') =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('@nestjs/common').SetMetadata(SELF_RESOURCE_KEY, paramName);

@Injectable()
export class SelfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const paramName = this.reflector.getAllAndOverride<string>(SELF_RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 没有 @SelfOnly 标注，直接放行
    if (!paramName) return true;

    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
      params: Record<string, string>;
    }>();
    const { user, params } = request;

    if (!user) throw new ForbiddenException('用户未认证');

    // 拥有 user_read 权限的管理员可以访问任意用户的资源
    if (user.permissions.includes('user_read')) return true;

    // 普通用户只能访问自己的资源
    const targetUserId = params[paramName];
    if (!targetUserId) return true; // 没有目标 userId 参数，不做限制

    if (user.id !== targetUserId) {
      throw new ForbiddenException('无权访问其他用户的资源');
    }

    return true;
  }
}
