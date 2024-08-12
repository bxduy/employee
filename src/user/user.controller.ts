import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthGuard } from "../auth/auth.guard";
import { Auth } from "../auth/auth.decorator";
import { DataResponse } from "../config/responseConfig";
import { DepartmentManagementService } from "../departmentManagement/department_management.service";
import { DepartmentService } from "../department/department.service";
import { CreateUserDto } from "./dto/createUser.dto";
import { ErrorHandlingInterceptor } from "src/interceptor/error.interceptor";
import { RoleService } from "src/role/role.service";
import { TransformInterceptor } from "src/interceptor/transform.interceptor";
import { User } from "./user.entity";
import { Request } from "express";
import { EditUserDto } from "./dto/editUser.dto";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { RedisService } from "src/redis/redis.service";

@Controller('users')
export class UsersController {
    constructor(
        private readonly userService: UserService,
    ) { }


    @Post(':dep_id/create')
    @Auth(['create_user'])
    @UseGuards(AuthGuard)
    async createUser(
        @Param('dep_id') dep_id: number,
        @Body() body: CreateUserDto
    ): Promise<any> {
        return await this.userService.createUser(body);
    }

    @Get('departments/:dep_id/users/:emp_id')
    @Auth(['read_user'])
    @UseGuards(AuthGuard)
    async getUserById(
        @Param('dep_id') dep_id: number,
        @Param('emp_id') emp_id: number
    ): Promise<User> {
        return await this.userService.getUserById(emp_id);
    }

    @Get('')
    @UseGuards(AuthGuard)
    async getProfile(
        @Req() req: Request
    ): Promise<User> { 
        const { user } = req as any;
        const userId = user.id;
        return await this.userService.getUserById(userId);
    }


    @Put('/edit')
    @UseGuards(AuthGuard)
    async editUser(
        @Body() body: EditUserDto,
        @Req() req: Request
    ): Promise<any> {
        const { user } = req as any;
        const emp_id = user.id;
        return await this.userService.updateUser((Number)(emp_id), body);
    }

    @Put(':dep_id/:emp_id/edit')
    @Auth(['read_user'])
    @UseGuards(AuthGuard)
    async editUserForAdmin(
        @Param('dep_id') dep_id: number,
        @Param('emp_id') emp_id: number,
        @Body() body: EditUserDto
    ): Promise<any> {
        return await this.userService.updateUser((Number)(emp_id), body);
    }

    @Post('/change-password')
    @UseGuards(AuthGuard)
    async changePassword(
        @Body() body: ChangePasswordDto,
        @Req() req: Request
    ): Promise<any> { 
        const { user } = req as any;
        const userId = user.id;
        const checkOldPassword = await this.userService.checkOldPassword(userId, body.oldPassword);
        if (checkOldPassword) {
            return await this.userService.changePassword(userId, body);
        }
        throw new HttpException("Invalid password", HttpStatus.NOT_FOUND);
    }

    @Post('/logout')
    @UseGuards(AuthGuard)
    async logout(@Req() req: Request) { 
        const { user } = req as any;
        const userId = user.id;
        return await this.userService.deleteToken(userId);
    }

    @Delete(':dep_id/:emp_id/delete')
    @Auth(['delete_user'])
    @UseGuards(AuthGuard)
    async deleteUser(
        @Param('dep_id') dep_id: number,
        @Param('emp_id') emp_id: number
    ): Promise<any> { 
        return await this.userService.deleteUser(emp_id);
    }

    @Get('/search-name')
    @UseGuards(AuthGuard)
    async searchByName(
        @Query('name') name: string,  
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ): Promise<User[]> {  
        return await this.userService.searchUserByName(name, page, limit);
    }

    @Get('/search-dob')
    @UseGuards(AuthGuard)
    async searchByDob(
        @Query('startDate') start: string,
        @Query('endDate') end: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ): Promise<User[]> {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.userService.searchUserByDob(startDate, endDate, page, limit);
    }

    @Get(':dep_id')
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