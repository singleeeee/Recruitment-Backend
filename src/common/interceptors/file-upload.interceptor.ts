import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    return next.handle().pipe(
      tap({
        next: (data) => {
          // 文件上传成功的日志记录
          if (request.file) {
            console.log(`文件上传成功: ${request.file.originalname} (${request.file.size} bytes)`);
          }
        },
        error: (error) => {
          // 文件上传失败的日志记录
          if (request.file) {
            console.error(`文件上传失败: ${request.file.originalname}`, error.message);
          }
        },
      }),
    );
  }
}