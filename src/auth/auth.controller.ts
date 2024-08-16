import { Body, Controller, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UserLoginDto } from "src/user/dto/userLogin.dto";
import { RefreshTokenDto } from "./dto/refreshToken.dto";

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
    ) { }

    @Post('/login')
    @UsePipes(new ValidationPipe())
    async login(@Body() body: UserLoginDto): Promise<any> {
        return await this.authService.login(body);
    }

    @Post('/refresh-token')
    async refreshToken(
        @Body() body: RefreshTokenDto
    ): Promise<any> {
        return await this.authService.refreshToken(body.token);
    }

}