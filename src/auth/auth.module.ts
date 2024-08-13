import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "../user/user.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PermissionsModule } from "../permission/permission.module";
import { DepartmentManagementModule } from "src/departmentManagement/department_management.module";
import { RedisModule } from "src/redis/redis.module";
import { AuthGuard } from "./auth.guard";
import { DepartmentModule } from "src/department/department.module";
import * as dotenv from "dotenv";
dotenv.config({ path: '../.env' });
@Module({
    imports: [
        JwtModule.register({
            secret: process.env.ACCESS_TOKEN_KEY,
            signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE },
        }),
        JwtModule.register({
            secret: process.env.REFRESH_TOKEN_KEY,
            signOptions: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE },
        }),
        forwardRef(() => UserModule),
        PermissionsModule,
        DepartmentManagementModule,
        RedisModule,
        DepartmentModule
    ],
    providers: [AuthService],
    exports: [JwtModule],
    controllers: [AuthController]
})
export class AuthModule { }