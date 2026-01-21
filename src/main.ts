import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor'; // 导入 ResponseInterceptor

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global route prefix
  app.setGlobalPrefix('api/v1');

  // Global Response Interceptor for unified response format
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Recruitment Backend API')
    .setDescription('招新系统后端API文档 - 包含用户认证、招新管理、申请管理、角色权限管理等功能')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name will be used in the @ApiBearerAuth() decorator
    )
    .addTag('auth', '用户认证相关接口')
    .addTag('users', '用户管理相关接口')
    .addTag('admin', '管理员相关接口')
    .addTag('recruitment', '招新管理相关接口')
    .addTag('applications', '申请管理相关接口')
    .addTag('ai', 'AI功能相关接口')
    .addTag('files', '文件管理相关接口')
    .addTag('clubs', '社团管理相关接口')
    .addTag('roles', '角色管理相关接口')
    .addTag('permissions', '权限管理相关接口')
    .addTag('Registration Fields', '注册字段管理相关接口')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1,
      tagsSorter: 'alpha', // Sort tags alphabetically
      operationsSorter: 'alpha', // Sort operations alphabetically
    },
    customSiteTitle: 'Recruitment System API Docs',
    customCss: '.swagger-ui .topbar { background-color: #f8f9fa; } .swagger-ui .info { margin: 20px 0; }',
  });

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API文档地址: http://localhost:${port}/api/docs`);
}

bootstrap();