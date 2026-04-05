import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor'; // 导入 ResponseInterceptor
import { swaggerConfig } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS configuration
  const rawOrigin = configService.get<string>('CORS_ORIGIN') || '*';
  // 支持多个 origin（逗号分隔），并自动去掉末尾斜杠
  const allowedOrigins = rawOrigin === '*'
    ? '*'
    : rawOrigin.split(',').map((o) => o.trim().replace(/\/$/, ''));
  app.enableCors({
    origin: allowedOrigins,
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
  const document = SwaggerModule.createDocument(app, swaggerConfig);
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