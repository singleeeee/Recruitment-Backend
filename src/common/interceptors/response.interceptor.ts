import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
  success: boolean;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;
    
    return next.handle().pipe(
      map((data) => {
        // StreamableFile 需要直接透传，不能被 JSON 包装
        if (data instanceof StreamableFile) {
          return data as any;
        }
        return {
          code: statusCode,
          message: this.getMessage(statusCode),
          data,
          success: statusCode < 400,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private getMessage(statusCode: number): string {
    switch (statusCode) {
      case 200:
        return '请求成功';
      case 201:
        return '创建成功';
      case 204:
        return '删除成功';
      case 400:
        return '请求参数错误';
      case 401:
        return '未授权访问';
      case 403:
        return '禁止访问';
      case 404:
        return '资源不存在';
      case 500:
        return '服务器内部错误';
      default:
        return '操作成功';
    }
  }
}