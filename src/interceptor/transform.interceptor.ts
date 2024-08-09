import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    code: number;
    data?: T;
    message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        return next.handle().pipe(
            map(data => {
                const isError = data instanceof Error;
                console.log(data);
                
                return {
                    code: isError ? 500 : 200,
                    data: isError ? null : data,
                    message: isError ? data.message : 'Success',
                };
            })
        );
    }
}