import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthGuard } from "../auth/auth.guard";
import { Auth } from "../auth/auth.decorator";
import { CreateUserDto } from "./dto/createUser.dto";
import { User } from "./user.entity";
import { Request } from "express";
import { EditUserDto } from "./dto/editUser.dto";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { diskStorage } from "multer";
import { FileInterceptor } from "@nestjs/platform-express";
import { extname } from "path";
import { FileService } from "src/file/file.service";

@Controller('users')
export class UsersController {
    constructor(
        private readonly userService: UserService,
        private readonly fileService: FileService
    ) { }

    @Get('/profile')
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
}