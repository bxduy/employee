import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Department } from "./department.entity";
import { DepartmentService } from "./department.service";
import { DepartmentManagementModule } from "src/departmentManagement/department_management.module";
import { DepartmentController } from "./department.controller";
import { AuthModule } from "src/auth/auth.module";
import { PermissionsModule } from "src/permission/permission.module";
import { UserModule } from "src/user/user.module";
import { RedisModule } from "src/redis/redis.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Department]),
        DepartmentManagementModule,
        forwardRef(() => AuthModule),
        PermissionsModule,
        forwardRef(() => UserModule),
        RedisModule
    ],
    providers: [DepartmentService],
    exports: [DepartmentService],
    controllers: [DepartmentController]
})
export class DepartmentModule{}