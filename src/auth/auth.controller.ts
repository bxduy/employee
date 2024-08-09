import { Body, Controller, HttpStatus, Post, UseInterceptors, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UserLoginDto } from "src/user/dto/userLogin.dto";
import {DataResponse } from "../config/responseConfig"
import { UserService } from "src/user/user.service";
import { TransformInterceptor } from "src/interceptor/transform.interceptor";
import { ErrorHandlingInterceptor } from "src/interceptor/error.interceptor";
import { RefreshTokenDto } from "./dto/refreshToken.dto";

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService
    ) { }

    @Post('/login')
    @UsePipes(new ValidationPipe())
    async login(@Body() body: UserLoginDto): Promise<any> {
        return await this.authService.isExistingUser(body);
    }

    @Post('/refresh_token')
    async refreshToken(
        @Body() body: RefreshTokenDto
    ): Promise<any> {
        return await this.authService.refreshToken(body.token);
    }

}