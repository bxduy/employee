import { Controller, Get, HttpStatus, Req, UseGuards } from "@nestjs/common";
import { DepartmentService } from "./department.service";
import { DepartmentManagementService } from "src/departmentManagement/department_management.service";
import { DataResponse } from "src/config/responseConfig";
import { AuthGuard } from "src/auth/auth.guard";
import { Request } from "express";

@Controller('departments')
export class DepartmentController{
    constructor(
        private readonly departmentService: DepartmentService,
        private readonly departmentManagementService: DepartmentManagementService
    ) { }
    @Get()
    @UseGuards(AuthGuard)
    async getDepartmentsOfUser(@Req() req: Request): Promise<any>{

            const { user } = req as any;
            const userId = user.id;
            const ids = await this.departmentManagementService.getDepartmentIdOfAdmin(userId);
            return await this.departmentService.getDepartmentOfAdmin(ids);
        

        
    }
}