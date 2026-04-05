import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * 标注接口所需的权限 code
 * 支持传入多个，全部满足才放行（AND 逻辑）
 *
 * @example
 * @RequirePermission('recruitment_read')
 * @RequirePermission('recruitment_create', 'club_read')
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
