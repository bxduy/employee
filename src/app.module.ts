import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PermissionsModule } from './permission/permission.module';
import { DepartmentManagementModule } from './departmentManagement/department_management.module';
import { DepartmentModule } from './department/department.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1312002',
      database: 'employee',
      entities: ["dist/**/*.entity{.ts,.js}"],
      migrations: ["dist/migration/**/*{.ts,.js}"],
      migrationsTableName: "custom_migration_table",
      timezone: 'UTC +7',
      logging: true 
    }),
    AuthModule,
    UserModule,
    PermissionsModule,
    DepartmentManagementModule,
    DepartmentModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
