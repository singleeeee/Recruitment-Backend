# 角色权限管理 API 文档

## 📋 实现完成的功能

已成功实现完整的角色权限管理系统，包含以下功能：

### 1. 角色管理 API (/api/v1/roles)

**基本角色操作：**
- `GET /roles` - 获取所有角色列表
- `GET /roles/{id}` - 根据ID获取角色详情  
- `GET /roles/code/{code}` - 根据角色代码获取角色信息
- `POST /roles` - 创建新角色
- `PUT /roles/{id}` - 更新角色信息
- `DELETE /roles/{id}` - 删除角色

**角色权限操作：**
- `POST /roles/{id}/permissions` - 分配权限给角色（替换所有权限）
- `POST /roles/{id}/permissions/add` - 添加权限到角色
- `DELETE /roles/{id}/permissions/remove` - 从角色移除权限
- `GET /roles/{id}/permissions` - 获取角色权限代码列表
- `GET /roles/{id}/has-permission/{code}` - 检查角色是否有指定权限

### 2. 权限管理 API (/api/v1/permissions)

**基本权限操作：**
- `GET /permissions` - 获取所有权限列表，支持按模块筛选和搜索
- `GET /permissions/{id}` - 根据ID获取权限详情
- `GET /permissions/code/{code}` - 根据权限代码获取权限信息
- `POST /permissions` - 创建新权限
- `PUT /permissions/{id}` - 更新权限信息
- `DELETE /permissions/{id}` - 删除权限
- `POST /permissions/batch` - 批量创建权限

**权限查询功能：**
- `GET /permissions/grouped` - 获取按模块分组的权限列表
- `GET /permissions/modules` - 获取所有权限模块列表
- `GET /permissions/stats` - 获取权限统计信息
- `POST /permissions/validate` - 验证权限代码有效性

### 3. 数据模型

**角色（Role）：**
- id: UUID
- name: 角色名称
- code: 角色代码（唯一）
- description: 角色描述
- level: 角色级别（0:候选人, 1:社团管理员, 2:超级管理员）
- isActive: 启用状态
- permissions: 关联的权限列表

**权限（Permission）：**
- id: UUID
- name: 权限名称
- code: 权限代码（唯一）
- module: 所属模块
- description: 权限描述

### 4. 访问控制

- 所有角色权限管理接口都需要 `super_admin` 权限
- 使用 JWT 认证
- 权限验证通过 RolesGuard 实现

### 5. Swagger 文档

- 完整的 API 文档已生成
- 支持在线测试
- 包含详细的参数说明和示例

所有接口已实现并通过 Swagger UI 可用。