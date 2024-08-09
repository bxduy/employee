import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ErrorHandlingInterceptor } from './interceptor/error.interceptor';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { ValidationExceptionFilter } from './filter/validation-exception.filter';
import { AllExceptionsFilter } from './filter/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableCors({
    origin: '*', // Chấp nhận tất cả các nguồn gốc. Thay đổi tùy theo nhu cầu của bạn.
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(9999, () => {
    console.log('server listening on port 9999');
    
  });
}
bootstrap();
