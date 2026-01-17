# 安装指南

## 当前状态

项目基础结构已完成，包括：
- ✅ NestJS 项目结构
- ✅ Prisma 数据库模型定义
- ✅ Docker Compose 配置（PostgreSQL + Redis）
- ✅ 环境变量配置
- ✅ 健康检查 API
- ✅ 启动脚本和文档

## 需要完成的步骤

### 1. 解决 npm 权限问题

当前系统遇到 npm 缓存权限问题（EPERM 错误），需要以下操作之一：

#### 方案 A：以管理员身份运行
```bash
# 关闭当前的终端，以管理员身份重新打开 PowerShell
# 然后运行安装命令
npm install
```

#### 方案 B：清除 npm 缓存
```bash
npm cache clean --force
npm install
```

#### 方案 C：配置 npm 使用不同的缓存目录
```bash
npm config set cache "C:\temp\npm-cache"
npm install
```

### 2. 启动 Docker 服务

在解决了 npm 安装问题后，启动数据库服务：

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d postgres redis

# 查看容器状态
docker-compose ps
```

### 3. 安装项目依赖

```bash
npm install
# 或者
pnpm install  # 如果安装了 pnpm
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate
# 或者
pnpm prisma:generate

# 运行数据库迁移
npm run prisma:migrate
# 或者
pnpm prisma:migrate
```

### 5. 启动开发服务器

```bash
npm run start:dev
# 或者
pnpm start:dev
```

### 6. 测试 API

访问健康检查端点：
```bash
curl http://localhost:3001/api/v1/health
```

或使用浏览器访问：
```
http://localhost:3001/api/v1/health
```

## 项目结构说明

```
recruitment-backend/
├── src/                          # 源代码目录
│   ├── main.ts                   # 应用入口
│   ├── app.module.ts             # 根模块
│   ├── health/                   # 健康检查模块
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   └── modules/                  # 业务模块
│       ├── prisma/               # Prisma 数据库服务
│       ├── auth/                 # 认证模块（待实现）
│       ├── users/                # 用户模块（待实现）
│       ├── recruitment/          # 招新模块（待实现）
│       └── applications/          # 申请模块（待实现）
├── prisma/
│   └── schema.prisma             # 数据库模型定义
├── scripts/                      # 脚本文件
│   ├── setup.sh                  # Linux/Mac 启动脚本
│   ├── setup.bat                 # Windows 启动脚本
│   └── test-db.ts                # 数据库测试脚本
├── docker-compose.yml            # Docker Compose 配置
├── .env                          # 环境变量（已配置）
├── .env.example                  # 环境变量模板
├── package.json                  # 项目依赖配置
├── tsconfig.json                 # TypeScript 配置
└── README.md                     # 项目文档
```

## 已配置的数据库表

根据需求文档，已在 `prisma/schema.prisma` 中定义以下核心表：

1. **users** - 用户表
   - 支持候选人、管理员、系统管理员角色
   - 包含学生信息（学号、学院、专业等）

2. **recruitment_batches** - 招新批次表
   - 支持招新活动的生命周期管理
   - 包含自定义问题和配置

3. **applications** - 申请表
   - 完整的申请状态机
   - AI 评分和分析结果存储
   - 教育、技能、经历等结构化数据

4. **interviews** - 面试安排表
   - 面试时间和地点/链接
   - 面试题库关联

5. **interview_feedbacks** - 面试反馈表
   - 多维度评分
   - 录用建议

6. **files** - 文件表
   - 支持简历、作品集等文件上传

7. **notifications** - 通知表
   - 系统通知和邮件通知记录

## 下一步开发计划

根据需求文档的阶段性划分，接下来需要实现：

### 阶段二：核心功能开发
1. **用户认证系统**
   - 注册登录 API
   - JWT 令牌管理
   - 密码加密和验证

2. **招新管理模块**
   - 招新活动 CRUD
   - 状态管理
   - 自定义问题配置

3. **申请流程**
   - 申请提交
   - 状态流转
   - 文件上传

4. **基础 UI 组件**（前端部分）

### 阶段三：智能功能集成
1. **AI 分析模块**
   - 简历评分
   - 技能标签提取
   - 面试题库生成

2. **邮件通知服务**
   - 邮件模板
   - 定时任务
   - 发送队列

## 常见问题

### Q: Docker 容器无法启动？
A: 确保 Docker Desktop 正在运行，可以尝试 `docker-compose down` 后重新启动。

### Q: 数据库连接失败？
A: 检查：
1. Docker 容器是否正常运行：`docker-compose ps`
2. 查看容器日志：`docker-compose logs postgres`
3. 确认 `.env` 文件中的数据库连接字符串正确

### Q: npm install 失败？
A: 参考"解决 npm 权限问题"部分的方案 A/B/C。

### Q: 端口被占用？
A: 修改 `docker-compose.yml` 或 `.env` 中的端口号。

## 联系方式

如有问题，请查看项目 README.md 或联系项目维护者。
