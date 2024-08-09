import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DepartmentManagement } from "./department_management.entity";
import { DepartmentManagementService } from "./department_management.service";
import { UserModule } from "src/user/user.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([DepartmentManagement]),
        forwardRef(() => UserModule)
    ],
    providers: [DepartmentManagementService],
    exports: [DepartmentManagementService],
})
export class DepartmentManagementModule { }