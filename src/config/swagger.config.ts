import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('高校社团智能化在线招新系统 API')
  .setDescription('基于 NestJS 构建的高校社团招新系统后端 API 文档。\n\n' +
    '## 认证方式\n\n' +
    '所有需要认证的API都需要在请求头中携带JWT令牌：\n' +
    'Authorization: Bearer <your-jwt-token>\n\n' +
    '## API 功能模块\n\n' +
    '### 认证模块 (/auth)\n' +
    '- 用户注册、登录\n' +
    '- JWT 令牌管理和刷新\n\n' +
    '### 用户管理 (/users)\n' +
    '- 用户信息管理\n' +
    '- 个人资料获取\n\n' +
    '### 系统监控 (/health)\n' +
    '- 数据库连接状态检查\n' +
    '- 系统健康状态监控\n\n' +
    '## 数据格式\n\n' +
    '### 时间格式\n' +
    '- 使用 ISO 8601 格式\n' +
    '- 例如: 2026-01-17T07:30:00.000Z\n\n' +
    '### 响应示例\n' +
    '成功响应:\n' +
    '{"accessToken":"jwt-token","user":{"id":"uuid","email":"user@example.com","role":"candidate"}}\n\n' +
    '### 错误响应\n' +
    '{"message":"错误描述","statusCode":400}\n\n' +
    '## 相关文档\n\n' +
    '- 快速启动指南\n' +
    '- API使用说明')
  .setVersion('1.0.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: '输入JWT令牌',
      in: 'header',
    },
    'JWT-auth',
  )
  .addTag('auth', '用户认证相关接口')
  .addTag('users', '用户管理相关接口')
  .addTag('health', '系统健康检查')
  .setContact('开发团队', 'https://github.com/recruitment-system', 'dev@recruitment.com')
  .setLicense('MIT License', 'https://opensource.org/licenses/MIT')
  .build();



