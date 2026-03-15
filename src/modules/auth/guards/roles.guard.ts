import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // 移除 JwtStrategy import

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // 如果没有 @Roles 装饰器，则允许访问
    }

    const { user } = context.switchToHttp().getRequest();
    console.log('=== RolesGuard调试信息 ===');
    console.log('Required roles:', requiredRoles);
    console.log('User object keys:', Object.keys(user));
    console.log('User.role:', user.role, typeof user.role);
    console.log('User.roleCode:', user.roleCode, typeof user.roleCode);
    
    if (!user || !user.role) {
      console.log('❌ 用户或角色信息缺失');
      throw new ForbiddenException('用户未认证或角色信息缺失');
    }

    // Check if the user's role CODE (from JWT payload) is in the required roles
    const hasRole = requiredRoles.includes(user.role);
    console.log('Permission check - requiredRoles.includes(user.role):', hasRole);
    
    if (!hasRole) {
        console.log('❌ 权限检查失败');
        throw new ForbiddenException('用户权限不足，无法访问此资源');
    }
    return hasRole;
  }
}
