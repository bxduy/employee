import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "../user/user.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PermissionsModule } from "../permission/permission.module";
import { DepartmentManagementModule } from "src/departmentManagement/department_management.module";
import { AuthGuard } from "./auth.guard";
import { DepartmentModule } from "src/department/department.module";

@Module({
    imports: [
        JwtModule.register({
            secret: 'keyyyy', 
            signOptions: { expiresIn: '20m' },
        }),
        forwardRef(() => UserModule),
        PermissionsModule,
        DepartmentManagementModule,
        DepartmentModule
    ],
    providers: [AuthService],
    exports: [JwtModule],
    controllers: [AuthController]
}) 
export class AuthModule { }