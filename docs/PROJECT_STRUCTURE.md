# 项目目录结构说明

## 📁 根目录结构

```
Recruitment-Backend/
├── 📁 src/                           # 主要源代码
├── 📁 prisma/                        # 数据库配置和迁移
├── 📁 docs/                          # 项目文档
├── 📁 tests/                         # 测试文件
├── 📁 scripts/                       # 实用脚本
├── 📁 uploads/                       # 文件上传存储
├── 📄 README.md                      # 项目主文档
├── 📄 PROJECT_STRUCTURE.md           # 本文件
├── 📄 package.json                   # 项目配置
└── 📄 .gitignore                     # Git忽略规则
```

## 📂 详细目录结构

### src/ - 主要源代码
```
src/
├── 📁 common/                        # 公共组件
│   ├── 📁 decorators/               # 装饰器
│   ├── 📁 filters/                  # 异常过滤器
│   └── 📁 interceptors/             # 拦截器
├── 📁 config/                       # 配置文件
│   ├── 📄 swagger.config.ts         # Swagger配置
│   └── 📄 upload.config.ts          # 文件上传配置
├── 📁 health/                       # 健康检查模块
│   ├── 📄 health.controller.ts
│   └── 📄 health.module.ts
├── 📁 modules/                      # 业务模块
│   ├── 📁 applications/             # 申请管理
│   ├── 📁 auth/                     # 认证授权
│   ├── 📁 files/                    # 文件管理（已完成）
│   ├── 📁 prisma/                   # 数据库服务
│   ├── 📁 recruitment/              # 招新管理
│   └── 📁 users/                    # 用户管理
└── 📄 main.ts                       # 应用入口
```

### prisma/ - 数据库层
```
prisma/
├── 📁 migrations/                    # 数据库迁移
│   └── 📁 20260117064045_recruitment/
│       └── 📄 *.sql                 # 迁移SQL文件
├── 📄 schema.prisma                 # Prisma数据模型定义
└── 📄 migration_lock.toml           # 迁移锁定文件
```

### docs/ - 项目文档
```
docs/
├── 📄 README.md                     # 文档目录说明
├── 📄 QUICKSTART.md                # 快速开始指南
├── 📄 INSTALLATION.md              # 安装部署说明
├── 📄 PROJECT_STATUS.md            # 项目进度报告
├── 📄 毕设项目-招新系统需求文档.md   # 需求规格文档
├── 📄 AUTH_IMPLEMENTATION.md       # 认证模块实现
├── 📄 SWAGGER_IMPLEMENTATION.md    # API文档实现
├── 📄 FILE_UPLOAD_GUIDE.md         # 文件上传API指南
└── 📄 FILE_UPLOAD_README.md        # 文件上传实现总结
```

### tests/ - 测试文件
```
tests/
├── 📄 auth.test.js                  # 认证功能测试
├── 📄 new-fields.test.js           # 新字段测试
├── 📄 response-format.test.js      # 响应格式测试
├── 📄 swagger.test.js              # Swagger测试
└── 📁 scripts/                     # 测试脚本
    ├── 📄 test-server-start.js     # 服务器启动检查
    └── 📄 test-upload-config.js    # 上传配置检查
```

### scripts/ - 实用脚本
```
scripts/
├── 📄 setup.bat                     # Windows安装脚本
├── 📄 setup.sh                      # Linux/Mac安装脚本
└── 📄 test-db.ts                    # 数据库测试脚本
```

## 🗂️ 关键文件说明

### 配置文件
- **package.json** - 项目依赖和脚本配置
- **tsconfig.json** - TypeScript编译配置
- **.gitignore** - Git忽略规则配置
- **.env** - 环境变量配置（不提交到Git）
- **docker-compose.yml** - Docker容器配置
- **nest-cli.json** - NestJS CLI配置

### 数据模型 (prisma/schema.prisma)
```prisma
// 核心数据模型
model User {                    # 用户表
model RecruitmentBatch {       # 招新批次表
model Application {            # 申请表
model Interview {             # 面试安排表
model File {                  # 文件表（已创建文件上传功能）
model Notification {          # 通知表
```

### 业务模块
1. **Auth模块** - 用户认证（登录、注册、JWT）
2. **Users模块** - 用户管理（CRUD、权限）
3. **Files模块** - 文件上传（已实现完整功能）
4. **Recruitment模块** - 招新管理（活动创建、管理）
5. **Applications模块** - 申请流程（提交、审核、状态流）
6. **Prisma模块** - 数据库访问层

## 🔧 开发环境配置

### 运行时依赖
- Node.js ≥ 18.0.0
- PostgreSQL 15
- Redis 7
- Docker & Docker Compose

### 开发工具
- TypeScript 5.x
- NestJS 10.x
- Prisma 5.x
- Jest（测试框架）

## 🚀 快速开始

### 环境准备
1. 安装 Node.js、Docker
2. 复制 `.env.example` 到 `.env` 并配置
3. 运行 `npm install` 安装依赖

### 数据库设置
1. 启动数据库: `docker-compose up -d postgres redis`
2. 运行迁移: `npm run prisma:migrate`
3. 生成Prisma Client: `npm run prisma:generate`

### 启动开发服务器
```bash
npm run start:dev          # 开发模式
npm run build             # 编译项目
npm run start:prod        # 生产模式
```

## 📋 API端点结构

```
GET    /api/v1/health                     # 健康检查
POST   /api/v1/auth/register             # 用户注册
POST   /api/v1/auth/login                # 用户登录
GET    /api/v1/users/me                  # 获取当前用户
POST   /api/v1/files/upload              # 文件上传（已实现）
GET    /api/v1/files                     # 文件列表（已实现）
GET    /api/v1/files/:id                 # 文件下载（已实现）
DELETE /api/v1/files/:id                 # 文件删除（已实现）
GET    /api/v1/recruitment               # 招新列表
POST   /api/v1/applications              # 提交申请
```

## 🎯 项目状态（截至2026年1月18日）

### ✅ 已完成
- ✅ 基础框架搭建
- ✅ 数据库设计（Prisma）
- ✅ 认证系统（JWT）
- ✅ 文件上传模块（完整实现）
- ✅ API文档（Swagger）
- ✅ 健康检查
- ✅ Docker容器配置

### 🔄 进行中
- 🔄 用户管理模块
- 🔄 招新管理模块
- 🔄 申请管理模块

### 📋 待开发
- 📋 AI分析模块
- 📋 面试管理模块
- 📋 通知系统
- 📋 邮件服务

## 🔄 Git忽略规则

### 不包含在版本控制中的内容
```
# 依赖
node_modules/

# 构建输出
dist/
build/

# 环境变量
.env
.env.local

# 日志文件
logs/
*.log

# 测试相关
coverage/
test-results/
# 个人测试脚本

# 上传的文件
uploads/

# IDE配置
.vscode/
.idea/
```

## 📚 相关文档

- [快速开始指南](./docs/QUICKSTART.md)
- [安装部署说明](./docs/INSTALLATION.md)
- [项目进度报告](./docs/PROJECT_STATUS.md)
- [文件上传API文档](./docs/FILE_UPLOAD_GUIDE.md)
- [需求规格说明书](./docs/毕设项目-招新系统需求文档.md)

---

💡 **注意事项**：
1. 所有敏感配置都存储在 `.env` 文件中，不提交到Git
2. 上传的文件存储在 `uploads/` 目录，不提交到Git
3. 测试文件和个人脚本在 `.gitignore` 中排除
4. 更新功能时请同步更新相关文档