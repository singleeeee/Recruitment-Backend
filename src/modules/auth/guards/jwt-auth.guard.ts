import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 检查路由是否为公开访问
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    // ---- IMPORTANT: 添加 console.log 以调试 ----
    console.log("--- JwtAuthGuard.handleRequest: JWT Verification Failed ---");
    console.log("Error object:", err);
    console.log("User object:", user); // 通常为 null
    console.log("Info object:", info); // 这是 JWT 验证失败的具体原因，非常重要！
    // ---------------------------------------

    // 临时解决方案: 如果请求是到 /auth/login，则忽略所有 JWT 错误并返回 null 用户
    const request = context.switchToHttp().getRequest();
    const path = request?.url; // 获取请求路径

    if (path && path.includes('/auth/login')) {
      console.warn('警告: JwtAuthGuard 拦截了 /auth/login 请求。由于此路由需公开访问，已临时放行。');
      return null; // 直接返回 null 用户，绕过 JWT 验证
    }

    if (err || !user) {
      // 这里的错误消息可能需要调整，以提供更具体的用户反馈
      // 目前的实现只是简单地抛出一个通用的 UnauthorizedException
      throw err || new UnauthorizedException('无效或过期的访问令牌');
    }
    return user;
  }
}