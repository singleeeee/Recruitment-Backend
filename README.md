# 高校社团智能化在线招新系统 - 后端服务

基于 NestJS + Prisma + PostgreSQL 的高校社团招新系统后端服务。

## 技术栈

- **框架**: NestJS 10
- **语言**: TypeScript 5
- **数据库**: PostgreSQL 15
- **ORM**: Prisma 5
- **缓存**: Redis 7
- **容器化**: Docker & Docker Compose
- **包管理**: pnpm

## 项目结构

```
recruitment-backend/
├── src/
│   ├── main.ts                      # 应用入口
│   ├── app.module.ts                # 根模块
│   ├── health/                      # 健康检查模块
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   └── modules/                     # 业务模块
│       ├── prisma/                  # Prisma 数据库服务
│       ├── auth/                    # 认证模块
│       ├── users/                   # 用户模块
│       ├── recruitment/             # 招新模块
│       └── applications/             # 申请模块
├── prisma/
│   └── schema.prisma                # 数据库模型定义
├── scripts/                        # 脚本文件
├── docker-compose.yml               # Docker Compose 配置
├── .env                             # 环境变量
└── package.json
```

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose

### 1. 克隆项目

```bash
git clone <repository-url>
cd recruitment-backend
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 根据需要修改 .env 文件中的配置
```

### 3. 启动数据库服务

```bash
# 启动 PostgreSQL 和 Redis 容器
docker-compose up -d postgres redis

# 检查容器状态
docker-compose ps
```

### 4. 安装依赖

```bash
# 使用 pnpm 安装依赖
pnpm install
```

### 5. 初始化数据库

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# (可选) 打开 Prisma Studio 可视化管理数据库
pnpm prisma:studio
```

### 6. 启动开发服务器

```bash
# 启动开发服务器（热重载）
pnpm start:dev

# 或者启动生产服务器
pnpm build
pnpm start:prod
```

### 7. 测试 API

访问健康检查端点：

```bash
curl http://localhost:3001/api/v1/health
```

预期响应：

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-13T10:00:00.000Z"
}
```

## 一键启动（Windows）

```bash
# 运行启动脚本
.\scripts\setup.bat
```

## 数据库管理

### 使用 Prisma Studio

```bash
pnpm prisma:studio
```

这将启动一个可视化的数据库管理界面，默认在浏览器中打开 `http://localhost:5555`。

### 使用 pgAdmin

启动所有服务后，访问 `http://localhost:5050` 使用 pgAdmin 管理数据库。

- 邮箱: admin@admin.com
- 密码: admin123

### 连接配置

```
Host: localhost
Port: 5432
Database: recruitment
User: admin
Password: admin123
```

## 可用命令

```bash
# 开发
pnpm start:dev          # 启动开发服务器（带热重载）
pnpm start:debug        # 启动调试模式
pnpm build              # 构建项目
pnpm start:prod         # 启动生产服务器

# 测试
pnpm test               # 运行单元测试
pnpm test:e2e           # 运行 E2E 测试
pnpm test:cov           # 生成测试覆盖率报告

# 代码质量
pnpm lint               # 运行 ESLint
pnpm format             # 格式化代码

# 数据库
pnpm prisma:generate    # 生成 Prisma Client
pnpm prisma:migrate     # 运行数据库迁移
pnpm prisma:studio      # 打开 Prisma Studio
```

## Docker 服务

### 启动所有服务

```bash
docker-compose up -d
```

### 停止所有服务

```bash
docker-compose down
```

### 查看日志

```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 重启服务

```bash
docker-compose restart postgres
docker-compose restart redis
```

## 数据库模型

当前系统包含以下核心数据表：

- `users` - 用户表（候选人、管理员、系统管理员）
- `recruitment_batches` - 招新批次表
- `applications` - 申请表
- `interviews` - 面试安排表
- `interview_feedbacks` - 面试反馈表
- `files` - 文件表
- `notifications` - 通知表

详细的模型定义请查看 `prisma/schema.prisma` 文件。

## API 端点

### 健康检查

- `GET /api/v1/health` - 检查应用和数据库状态

### 认证（待实现）

- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新令牌

### 用户（待实现）

- `GET /api/v1/users/me` - 获取当前用户信息
- `PUT /api/v1/users/:id` - 更新用户信息

### 招新（待实现）

- `GET /api/v1/recruitment` - 获取招新列表
- `POST /api/v1/recruitment` - 创建招新活动

### 申请（待实现）

- `POST /api/v1/applications` - 提交申请
- `GET /api/v1/applications/:id` - 获取申请详情
- `PATCH /api/v1/applications/:id/status` - 更新申请状态

## 开发注意事项

### 环境变量

重要环境变量说明：

- `DATABASE_URL` - PostgreSQL 连接字符串
- `REDIS_HOST` - Redis 主机地址
- `JWT_SECRET` - JWT 密钥（生产环境务必修改）
- `PORT` - 应用端口，默认 3001

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写单元测试

### 数据库迁移

修改数据库模型后，需要创建新的迁移：

```bash
# 创建迁移
pnpm prisma migrate dev --name migration_name

# 应用迁移到生产环境
pnpm prisma migrate deploy
```

## 故障排查

### 数据库连接失败

1. 检查 Docker 容器是否运行：`docker-compose ps`
2. 检查数据库日志：`docker-compose logs postgres`
3. 确认 `.env` 中的 `DATABASE_URL` 配置正确

### 端口被占用

如果端口被占用，可以修改 `docker-compose.yml` 或 `.env` 中的端口配置。

### 依赖安装问题

清除缓存后重新安装：

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 生产环境部署

### 使用 Docker 部署

```bash
# 构建镜像
docker build -t recruitment-backend .

# 运行容器
docker run -p 3001:3001 --env-file .env recruitment-backend
```

### 环境变量配置

生产环境务必修改以下配置：

- `NODE_ENV=production`
- `JWT_SECRET` - 使用强密码
- `DATABASE_URL` - 使用生产数据库
- `SMTP_USER` / `SMTP_PASSWORD` - 配置邮件服务

## 许可证

MIT

## 联系方式

如有问题，请联系项目维护者。
