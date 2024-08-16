import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PermissionsModule } from './permission/permission.module';
import { DepartmentModule } from './department/department.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { ClassModule } from './class/class.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME, 
      entities: ["dist/**/*.entity{.ts,.js}"],
      migrations: ["dist/migration/**/*{.ts,.js}"],
      migrationsTableName: "custom_migration_table",
      timezone: 'UTC +7',
      logging: true 
    }),
    AuthModule,
    UserModule,
    PermissionsModule,
    DepartmentModule,
    RedisModule,
    ClassModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
