import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { DepartmentService } from "./department.service";
import { DepartmentManagementService } from "src/departmentManagement/department_management.service";
import { DataResponse } from "src/config/responseConfig";
import { AuthGuard } from "src/auth/auth.guard";
import { Request } from "express";
import { UserService } from "src/user/user.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { Auth } from "src/auth/auth.decorator";
import { CreateUserDto } from "src/user/dto/createUser.dto";
import { FileService } from "src/file/file.service";
import { User } from "src/user/user.entity";
import { EditUserDto } from "src/user/dto/editUser.dto";

@Controller('departments')
export class DepartmentController {
    constructor(
        private readonly departmentService: DepartmentService,
        private readonly departmentManagementService: DepartmentManagementService,
        private readonly userService: UserService,
        private readonly fileService: FileService
    ) { }
    @Get()
    @UseGuards(AuthGuard)
    async getDepartmentsOfUser(@Req() req: Request): Promise<any> {
        const { user } = req as any;
        const userId = user.id;
        const ids = await this.departmentManagementService.getDepartmentIdOfAdmin(userId);
        return await this.departmentService.getDepartmentOfAdmin(ids);
    }

    @Post(':dep_id/create-user')
    @Auth(['create_user'])
    @UseGuards(AuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: 'src/public/uploads',
                filename: (req, file, cb) => {
                    const filename = Date.now() + extname(file.originalname);
                    cb(null, filename);
                },
            }),
        }),
    )
    async createUser(
        @Param('dep_id') dep_id: number,
        @Body() body: CreateUserDto,
        @UploadedFile() file: Express.Multer.File
    ): Promise<any> {
        const user = await this.userService.createUser(body);
        return await Promise.all([
            this.fileService.saveFile(file.filename, file.path, "server", user),
            this.fileService.saveCloud(file, "cloud", user)
        ]);
    }

    @Get(':dep_id/users/:emp_id')
    @Auth(['read_user'])
    @UseGuards(AuthGuard)
    async getUserById(
        @Param('dep_id') dep_id: number,
        @Param('emp_id') emp_id: number
    ): Promise<User> {
        return await this.userService.getUserById(emp_id);
    }

    @Put(':dep_id/users/:emp_id/edit')
    @Auth(['read_user'])
    @UseGuards(AuthGuard)
    async editUserForAdmin(
        @Param('dep_id') dep_id: number,
        @Param('emp_id') emp_id: number,
        @Body() body: EditUserDto
    ): Promise<any> {
        return await this.userService.updateUser((Number)(emp_id), body);
    }

    @Delete(':dep_id/users/:emp_id/delete')
    @Auth(['delete_user'])
    @UseGuards(AuthGuard)
    async deleteUser(
        @Param('dep_id') dep_id: number,
        @Param('emp_id') emp_id: number
    ): Promise<any> { 
        return await this.userService.deleteUser(emp_id);
    }

    @Get(':dep_id/users')
    @Auth(['read_user'])
    @UseGuards(AuthGuard)
    async findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Param('dep_id') dep_id: number
    ): Promise<any> {

        return await this.userService.getUserOfDepartment(dep_id, page, limit);
    }
}