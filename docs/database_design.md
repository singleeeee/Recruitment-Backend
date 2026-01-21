# 🚀 数据库重新设计方案

## 📋 现有问题和改进目标

### 当前问题分析
1. **角色权限简单** - 只有基础的role字段，权限控制不够灵活
2. **注册字段固定** - 无法根据需求动态调整候选人注册字段
3. **缺乏权限管理** - 管理员权限层次不够清晰
4. **配置化不足** - 系统参数无法灵活配置

### 改进目标
1. ✅ **基于RBAC的角色权限系统**
2. ✅ **可配置的候选人注册表单**
3. ✅ **三层权限体系（超级管理员、社团负责人、候选人）**
4. ✅ **动态字段管理，支持后续扩展**

## 🗂️ 新数据表设计

### 1. 角色权限相关表

#### Role（角色表）
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,           -- 角色名称
    code VARCHAR(50) UNIQUE NOT NULL,           -- 角色代码 (system_admin, club_admin, candidate)
    description TEXT,                           -- 角色描述
    level INTEGER NOT NULL DEFAULT 0,          -- 角色级别 (0:候选人, 1:社团管理员, 2:超级管理员)
    is_active BOOLEAN DEFAULT true,            -- 是否启用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Permission（权限表）
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,                 -- 权限名称
    code VARCHAR(100) UNIQUE NOT NULL,          -- 权限代码 (user:create, user:read, recruitment:manage)
    module VARCHAR(50) NOT NULL,                -- 所属模块 (auth, user, recruitment, application)
    description TEXT,                           -- 权限描述
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Role_Permission（角色权限关联表）
```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);
```

### 2. 用户相关改进

#### User（改进的用户表）
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- 角色关联
    role_id UUID NOT NULL REFERENCES roles(id),
    
    -- 用户状态
    status VARCHAR(20) DEFAULT 'active',        -- active, inactive, suspended
    email_verified BOOLEAN DEFAULT false,       -- 邮箱验证状态
    
    -- 基本个人信息
    name VARCHAR(100),
    phone VARCHAR(20),
    avatar VARCHAR(500),                        -- 头像URL
    
    -- 候选人特有字段
    student_id VARCHAR(50) UNIQUE,              -- 学号
    college VARCHAR(100),                       -- 学院
    major VARCHAR(100),                         -- 专业
    grade VARCHAR(20),                          -- 年级
    
    -- 社团管理员特有字段
    club_id UUID,                               -- 所属社团（如果是社团管理员）
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 注册配置相关表

#### Registration_Field（注册字段配置表）
```sql
CREATE TABLE registration_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_name VARCHAR(100) NOT NULL,           -- 字段名称 (如: name, studentId, experience)
    field_label VARCHAR(100) NOT NULL,          -- 显示标签 (如: 姓名, 学号, 相关经验)
    field_type VARCHAR(50) NOT NULL,            -- 字段类型 (text, email, select, textarea, file, date)
    field_order INTEGER NOT NULL,               -- 字段排序
    is_required BOOLEAN DEFAULT false,          -- 是否必填
    is_active BOOLEAN DEFAULT true,             -- 是否启用
    options JSONB,                              -- 选项配置 (用于select类型)
    validation_rules JSONB,                     -- 验证规则
    placeholder TEXT,                           -- 占位符文本
    help_text TEXT,                             -- 帮助文本
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User_Profile_Field（用户档案字段表）
```sql
CREATE TABLE user_profile_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES registration_fields(id) ON DELETE CASCADE,
    field_value TEXT,                           -- 字段值
    file_id UUID,                               -- 关联文件ID（如果是文件类型）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, field_id)
);
```

### 4. 系统配置表

#### System_Settings（系统设置表）
```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,   -- 设置键
    setting_value TEXT,                         -- 设置值
    setting_type VARCHAR(50) DEFAULT 'string',  -- 值类型 (string, number, boolean, json)
    description TEXT,                           -- 设置描述
    is_public BOOLEAN DEFAULT false,            -- 是否公开（前端可读取）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 初始数据配置

### 默认角色数据
```sql
INSERT INTO roles (name, code, description, level) VALUES 
('系统管理员', 'super_admin', '系统最高权限管理员', 2),
('社团负责人', 'club_admin', '社团管理员，负责招新管理', 1),
('候选人', 'candidate', '系统用户，可以申请加入社团', 0);
```

### 默认权限数据
```sql
-- 用户模块权限
INSERT INTO permissions (name, code, module) VALUES 
('用户创建', 'user:create', 'user'),
('用户查看', 'user:read', 'user'),
('用户更新', 'user:update', 'user'),
('用户删除', 'user:delete', 'user'),
('用户管理', 'user:manage', 'user');

-- 认证模块权限
INSERT INTO permissions (name, code, module) VALUES 
('用户注册', 'auth:register', 'auth'),
('用户登录', 'auth:login', 'auth'),
('令牌刷新', 'auth:refresh', 'auth');

-- 招新模块权限
INSERT INTO permissions (name, code, module) VALUES 
('招新创建', 'recruitment:create', 'recruitment'),
('招新查看', 'recruitment:read', 'recruitment'),
('招新更新', 'recruitment:update', 'recruitment'),
('招新删除', 'recruitment:delete', 'recruitment'),
('招新管理', 'recruitment:manage', 'recruitment');

-- 申请模块权限
INSERT INTO permissions (name, code, module) VALUES 
('申请提交', 'application:submit', 'application'),
('申请查看', 'application:read', 'application'),
('申请审核', 'application:review', 'application'),
('申请管理', 'application:manage', 'application');

-- 文件模块权限
INSERT INTO permissions (name, code, module) VALUES 
('文件上传', 'file:upload', 'file'),
('文件下载', 'file:download', 'file'),
('文件删除', 'file:delete', 'file');

-- 系统模块权限
INSERT INTO permissions (name, code, module) VALUES 
('系统配置', 'system:config', 'system'),
('数据导出', 'system:export', 'system'),
('系统管理', 'system:manage', 'system');
```

### 角色权限分配
```sql
-- 超级管理员权限（所有权限）
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'system_admin';

-- 社团负责人权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'club_admin' AND p.module IN ('recruitment', 'application', 'file');

-- 候选人权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'candidate' AND p.code IN ('auth:register', 'auth:login', 'auth:refresh', 'application:submit', 'application:read', 'file:upload', 'file:download');
```

### 默认注册字段配置
```sql
INSERT INTO registration_fields 
(field_name, field_label, field_type, field_order, is_required, validation_rules, placeholder, help_text) VALUES
('name', '姓名', 'text', 1, true, '{"minLength": 2, "maxLength": 50}', '请输入您的真实姓名', '填写真实姓名有助于社团了解您'),
('email', '邮箱', 'email', 2, true, '{"pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"}', 'example@university.edu.cn', '请填写常用邮箱，用于接收通知'),
('studentId', '学号', 'text', 3, true, '{"pattern": "^[0-9]{10,12}$"}', '2021001001', '填写学校学号'),
('college', '学院', 'select', 4, true, null, '请选择您的学院', null),
('major', '专业', 'text', 5, true, '{"maxLength": 100}', '请输入您的专业', null),
('grade', '年级', 'select', 6, true, null, '请选择您的年级', null),
('phone', '手机号码', 'text', 7, false, '{"pattern": "^1[3-9]\\d{9}$"}', '13800138000', '用于重要通知联系'),
('experience', '相关经验', 'textarea', 8, false, '{"maxLength": 1000}', '请描述您的相关项目经验...', '可以是项目经历、实习经历、技能等'),
('motivation', '申请动机', 'textarea', 9, false, '{"maxLength": 1000}', '请说明您申请加入的原因...', '让社团了解您的想法和目标'),
('portfolio', '作品集', 'file', 10, false, null, '上传您的作品文件', '支持PDF、图片、压缩包格式，最大10MB');

-- 配置选项
UPDATE registration_fields 
SET options = '["计算机学院", "软件学院", "信息学院", "电子学院", "通信学院", "自动化学院", "数学学院", "物理学院", "化学学院", "生物学院", "经管学院", "外语学院", "文学院", "法学院", "艺术学院", "体育学院", "其他"]'
WHERE field_name = 'college';

UPDATE registration_fields 
SET options = '["计算机科学与技术", "软件工程", "信息安全", "网络工程", "数据科学与大数据技术", "人工智能", "物联网工程", "数字媒体技术", "智能科学与技术", "其他计算机相关专业", "其他"]'
WHERE field_name = 'major';

UPDATE registration_fields 
SET options = '["2020级", "2021级", "2022级", "2023级", "2024级", "研一", "研二", "研三", "博士", "其他"]'
WHERE field_name = 'grade';
```

## 🔄 数据迁移策略

### 1. 现有数据迁移
```sql
-- 将现有用户数据迁移到新结构
INSERT INTO roles (name, code, description, level)
SELECT 
    CASE 
        WHEN role = 'system_admin' THEN '超级管理员'
        WHEN role = 'admin' THEN '社团负责人' 
        ELSE '候选人'
    END,
    CASE 
        WHEN role = 'system_admin' THEN 'system_admin'
        WHEN role = 'admin' THEN 'club_admin'
        ELSE 'candidate'
    END,
    CASE 
        WHEN role = 'system_admin' THEN '系统最高权限管理员'
        WHEN role = 'admin' THEN '社团管理员，负责招新管理'
        ELSE '系统用户，可以申请加入社团'
    END,
    CASE 
        WHEN role = 'system_admin' THEN 2
        WHEN role = 'admin' THEN 1
        ELSE 0
    END
FROM (SELECT DISTINCT role FROM users) as distinct_roles;
```

### 2. 应用升级路径
1. **添加新表** - 创建所有新的配置表
2. **数据迁移** - 将现有数据迁移到新结构
3. **字段映射** - 更新用户表结构
4. **业务适配** - 更新所有相关的业务逻辑

## 🎨 API接口设计

### 新增接口
```
GET    /api/v1/roles                    # 获取角色列表
POST   /api/v1/roles                    # 创建角色
PUT    /api/v1/roles/:id               # 更新角色
DELETE /api/v1/roles/:id               # 删除角色

GET    /api/v1/permissions             # 获取权限列表

GET    /api/v1/registration-fields     # 获取注册字段配置
POST   /api/v1/registration-fields     # 创建注册字段
PUT    /api/v1/registration-fields/:id # 更新注册字段
DELETE /api/v1/registration-fields/:id # 删除注册字段

GET    /api/v1/users/profile-fields    # 获取用户档案字段
PUT    /api/v1/users/profile-fields    # 更新用户档案字段

GET    /api/v1/system/settings         # 获取系统设置
PUT    /api/v1/system/settings         # 更新系统设置
```

## ⚠️ 注意事项

1. **数据一致性** - 迁移时需要保证现有数据不丢失
2. **权限兼容** - 确保现有用户能正常登录使用
3. **版本控制** - 数据库变更需要版本管理
4. **回滚方案** - 需要有完整的回滚策略
5. **测试充分** - 所有改动需要充分测试

这个设计提供了完整的RBAC权限系统和可配置的注册表单，为后续功能扩展奠定了良好基础。