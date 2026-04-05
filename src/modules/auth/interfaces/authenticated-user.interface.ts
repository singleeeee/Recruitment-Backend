/**
 * 经过 JWT 认证后挂载到 req.user 上的用户对象类型
 *
 * 来源：JwtStrategy.validate() 的返回值
 * - role: JWT payload 中的 roleCode 字符串（用于 RolesGuard）
 * - roleCode: 同上，别名
 * - roleData: 从数据库查出的完整 Role 对象（含 permissions）
 * - clubId: 社团管理员关联的社团 ID（club_admin 专用）
 */
export interface AuthenticatedUser {
  /** 用户 ID (UUID) */
  id: string;
  /** 邮箱 */
  email: string;
  /** 姓名 */
  name: string;
  /** 角色 Code 字符串（来自 JWT payload），如 'super_admin' | 'club_admin' | 'candidate' */
  role: string;
  /** role 的别名，与 role 值相同 */
  roleCode: string;
  /** 权限 code 列表（来自 JWT payload） */
  permissions: string[];
  /** 完整角色对象（含权限列表），来自数据库 */
  roleData: {
    id: string;
    name: string;
    code: string;
    permissions?: Array<{
      permission: {
        id: string;
        name: string;
        code: string;
      };
    }>;
  } | null;
  /** 关联社团 ID（仅 club_admin 有值） */
  clubId: string | null;
  /** 用户状态 */
  status: string;
  /** 头像 URL */
  avatar?: string | null;
}
