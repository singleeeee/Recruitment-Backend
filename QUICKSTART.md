# 快速启动指南

## ⚠️ 当前状态

项目基础框架已搭建完成，但存在 **npm 权限问题**，需要您手动解决依赖安装。

## 🔧 解决方案

### 方法 1：以管理员身份运行（推荐）

1. 关闭当前的 PowerShell
2. 右键点击 PowerShell，选择"以管理员身份运行"
3. 执行以下命令：
   ```bash
   cd e:/frontend/project/Recruitment-Backend
   npm install
   ```

### 方法 2：清除 npm 缓存

```bash
npm cache clean --force
npm install
```

### 方法 3：配置新的缓存目录

```bash
npm config set cache "C:\temp\npm-cache"
npm install
```

## 🚀 启动步骤

### 1. 启动 Docker 容器

```bash
docker-compose up -d postgres redis
```

等待 10-20 秒，确保数据库就绪。

### 2. 安装依赖（如果之前还没安装）

```bash
npm install
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate
```

### 4. 启动开发服务器

```bash
npm run start:dev
```

看到以下输出表示启动成功：
```
🚀 Application is running on: http://localhost:3001
```

### 5. 测试 API

打开浏览器或使用 curl 访问：
```
http://localhost:3001/api/v1/health
```

预期返回：
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-13T..."
}
```

## 📊 数据库管理

### 使用 Prisma Studio（推荐）

```bash
npm run prisma:studio
```

这会自动打开浏览器到 `http://localhost:5555`

### 使用 pgAdmin

1. 访问 `http://localhost:5050`
2. 登录：
   - 邮箱: admin@admin.com
   - 密码: admin123
3. 添加新服务器：
   - Host: localhost
   - Port: 5432
   - Database: recruitment
   - User: admin
   - Password: admin123

## 📁 项目结构

```
recruitment-backend/
├── src/
│   ├── main.ts              # 应用入口
│   ├── app.module.ts        # 根模块
│   ├── health/              # 健康检查
│   └── modules/             # 业务模块
│       ├── prisma/          # 数据库服务 ✅
│       ├── auth/            # 认证模块（待实现）
│       ├── users/           # 用户模块（待实现）
│       ├── recruitment/     # 招新模块（待实现）
│       └── applications/    # 申请模块（待实现）
├── prisma/
│   └── schema.prisma        # 数据库模型 ✅
├── docker-compose.yml       # Docker 配置 ✅
├── .env                     # 环境变量 ✅
└── package.json             # 项目配置 ✅
```

## 🗄️ 数据库表

已创建以下核心表：

- `users` - 用户表
- `recruitment_batches` - 招新批次表
- `applications` - 申请表
- `interviews` - 面试表
- `interview_feedbacks` - 面试反馈表
- `files` - 文件表
- `notifications` - 通知表

## 🔍 常用命令

```bash
# 开发
npm run start:dev          # 启动开发服务器
npm run build              # 构建项目
npm run start:prod         # 启动生产服务器

# 数据库
npm run prisma:generate    # 生成 Prisma Client
npm run prisma:migrate     # 运行数据库迁移
npm run prisma:studio      # 打开数据库管理界面

# Docker
docker-compose up -d       # 启动所有服务
docker-compose down        # 停止所有服务
docker-compose logs -f     # 查看日志
```

## ❓ 遇到问题？

### 问题1: npm install 失败
**解决方案**: 参考"解决方案"部分，以管理员身份运行或清除缓存。

### 问题2: 数据库连接失败
**解决方案**:
1. 检查 Docker 容器是否运行: `docker-compose ps`
2. 查看数据库日志: `docker-compose logs postgres`
3. 确认 `.env` 文件中的 `DATABASE_URL` 正确

### 问题3: 端口被占用
**解决方案**: 修改 `docker-compose.yml` 或 `.env` 中的端口号

### 问题4: Prisma Client 生成失败
**解决方案**:
```bash
rm -rf node_modules
npm install
npm run prisma:generate
```

## 📚 更多信息

- 完整文档: [README.md](README.md)
- 安装指南: [INSTALLATION.md](INSTALLATION.md)
- 项目进度: [PROJECT_STATUS.md](PROJECT_STATUS.md)
- 需求文档: [毕设项目-招新系统需求文档.md](毕设项目-招新系统需求文档.md)

## 🎯 下一步

基础框架已就绪，接下来可以开始实现核心功能：

1. **用户认证系统** (登录注册、JWT)
2. **用户管理模块** (CRUD、个人信息)
3. **招新管理模块** (创建招新、状态管理)
4. **申请管理模块** (提交申请、状态流转)
5. **AI 集成** (简历分析、面试题生成)
6. **通知系统** (邮件、站内通知)

详细计划请查看 [PROJECT_STATUS.md](PROJECT_STATUS.md)。
