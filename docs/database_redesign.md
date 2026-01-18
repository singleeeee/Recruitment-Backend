# 数据库重新设计文档

## 概述

本次数据库重新设计主要实现了以下改进：

1. **基于角色的权限管理系统（RBAC简化版）** - 实现了三层角色体系
2. **可配置化的用户注册表单** - 通过注册字段配置表实现
3. **社团管理功能增强** - 新增了社团表和相关关联
4. **系统设置管理** - 添加了系统配置表

## 新增数据表

### 1. Role（角色表）
定义系统中的三种角色：
- **超级管理员** (system_admin, level=2) - 管理所有功能和用户
- **社团负责人** (club_admin, level=1) - 管理招新流程和候选人
- **候选人** (candidate, level=0) - 申请社团职位

### 2. Permission（权限表）
定义系统中的权限模块：
- **用户管理** (user_manage) - user模块
- **招新管理** (recruitment_manage) - recruitment模块  
- **申请管理** (application_manage) - application模块
- **文件管理** (file_manage) - file模块
- **系统管理** (system_manage) - system模块

### 3. RolePermission（角色权限关联表）
建立角色与权限的多对多关系：
- 超级管理员：拥有所有权限
- 社团负责人：招新管理、申请管理、文件管理
- 候选人：文件管理（上传简历等）

### 4. RegistrationField（注册字段配置表）
配置用户注册时需要填写的字段：
- fieldName: 字段名称（如name, studentId, experience等）
- fieldLabel: 显示标签
- fieldType: 字段类型（text, email, select, textarea, file, date等）
- isRequired: 是否必填
- isActive: 是否启用
- validationRules: 验证规则
- fieldOrder: 字段排序

### 5. UserProfileField（用户档案字段表）
存储用户针对注册字段的具体值：
- userId: 用户ID
- fieldId: 字段ID  
- fieldValue: 字段值
- fileId: 关联的文件ID（用于文件类型的字段）

### 6. Club（社团表）
管理社团信息：
- name: 社团名称
- description: 社团描述
- category: 社团类别
- logo: 社团Logo
- isActive: 是否活跃

### 7. SystemSetting（系统设置表）
存储系统级别的配置：
- settingKey: 配置键
- settingValue: 配置值
- settingType: 值类型
- isPublic: 是否公开给前端

## 修改的数据表

### 1. User（用户表）
**主要变更：**
- 移除了role字段，改为roleId关联Role表
- 移除硬编码字段（experience, motivation），改为通过UserProfileField动态存储
- 新增status字段：用户状态（active, inactive, suspended）
- 新增emailVerified字段：邮箱验证状态
- 新增clubId字段：关联到社团，用于社团管理员
- 划分字段到不同用途的分类

### 2. RecruitmentBatch（招新批次表）
**主要变更：**
- 新增clubId字段：关联到具体的社团
- 新增club关联关系

## 数据迁移策略

### 1. 角色和权限初始化
需要插入基本的Role和Permission数据：

### 2. 字段配置初始化
插入现有的注册字段：
- 基本信息：name, studentId, college, major, grade, phone  
- 申请信息：experience, motivation
- 扩展信息：可以动态添加

### 3. 用户数据迁移
- 将原有的role字段值转换为对应的roleId
- 将原有的硬编码字段（experience, motivation）迁移到UserProfileField表

## 新特点

### 1. 简化的RBAC机制
- 角色与权限多对多关联，但默认配置保持简洁
- 所有权限预配置在数据库中，不需要复杂的前端权限管理
- 超级管理员默认拥有所有权限，其他角色根据需要分配

### 2. 可配置化的注册流程  
- 注册字段完全配置化，可以自由增删改
- 支持多种字段类型：文本、选择、文件上传、日期等
- 支持字段验证规则配置
- 可设置字段优先级和显示顺序

### 3. 灵活的档案系统
- 用户信息存储在UserProfileField中，支持不同类型的字段
- 字段值与文件关联，支持文件上传类型的字段
- 易于扩展新的字段类型和数据

### 4. 社团关联
- 招新批次现在可以关联到具体的社团
- 社团管理员只能管理自己社团的招新流程
- 社团信息与用户信息分离，便于管理

## API接口设计

### 权限相关
- `GET /roles` - 获取所有角色
- `POST /roles` - 创建角色 
- `GET /permissions` - 获取所有权限
- `POST /roles/{id}/permissions` - 分配权限给角色

### 注册字段相关
- `GET /registration-fields` - 获取注册字段配置
- `POST /registration-fields` - 创建注册字段
- `PUT /registration-fields/{id}` - 更新注册字段
- `DELETE /registration-fields/{id}` - 删除注册字段

### 用户档案管理
- `GET /profile-fields` - 获取当前用户的档案字段
- `POST /profile-fields` - 更新档案字段
- `POST /profile-fields/file` - 上传文件到档案字段

### 社团管理
- `GET /clubs` - 获取所有社团
- `POST /clubs` - 创建社团
- `PUT /clubs/{id}` - 更新社团信息

### 系统设置
- `GET /system-settings` - 获取系统设置
- `POST /system-settings` - 创建/更新系统设置

## 注意事项

1. **权限管理简化** - 采用预配置的权限分配，避免过于复杂的权限粒度
2. **数据迁移** - 需要编写迁移脚本，将原有数据转换到新的结构
3. **前端适配** - 需要根据新的注册字段配置动态生成表单
4. **性能考虑** - UserProfileField表可能会增长较快，需要考虑索引优化
5. **向后兼容** - 原有的某些字段仍在User表中，可以根据使用情况逐步迁移到UserProfileField

这种设计既保持了系统的灵活性，又避免了过度复杂的权限管理，适合社团招新系统的实际需求。