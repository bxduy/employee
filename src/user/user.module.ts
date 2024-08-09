import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { UserService } from "./user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UsersController } from "./user.controller";
import { PermissionsModule } from "src/permission/permission.module";
import { DepartmentManagementModule } from "src/departmentManagement/department_management.module";
import { DepartmentModule } from "src/department/department.module";
import { RedisModule } from "src/redis/redis.module";
import { RoleModule } from "src/role/role.module";

@Module({
    imports: [
        forwardRef(() => AuthModule),
        TypeOrmModule.forFeature([User]),
        PermissionsModule,
        DepartmentManagementModule,
        DepartmentModule,
        RedisModule,
        RoleModule
    ],
    providers: [UserService],
    exports: [UserService],
    controllers: [UsersController]
})
export class UserModule { }