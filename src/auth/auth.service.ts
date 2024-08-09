import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt'
import { UserLoginDto } from "../user/dto/userLogin.dto";
import { User } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { RedisService } from "src/redis/redis.service";

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly redisService: RedisService
    ) { }

    async isExistingUser(userLoginDto: UserLoginDto): Promise<any> {


        const user = await this.userService.checkExistingUser(userLoginDto.username);

        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        if (await bcrypt.compare(userLoginDto.password, user.password)) {
            const accessToken = this.createAccessToken(user);
            const refreshToken = this.createRefreshToken(user);
            const { id, password, access_token, refresh_token, ...userWithoutPassword } = user;
            await Promise.all([
                this.userService.updateToken(id, accessToken, refreshToken),
                this.redisService.set(accessToken, accessToken)
            ]);
            return { user: userWithoutPassword, accessToken, refreshToken };
        }
        throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);

    }

    private createAccessToken(user: User): string {
        const payload = { id: user.id };
        return this.jwtService.sign(payload)
    }

    private createRefreshToken(user: User): string {
        const payload = { id: user.id, username: user.username };
        return this.jwtService.sign(payload)
    }

    async refreshToken(token: string): Promise<any> { 
        const user = await this.userService.checkExistingToken(token, 'refresh_token');
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        const accessToken = this.createAccessToken(user);
        await Promise.all([
            this.userService.updateAccessToken(user.id, accessToken),
            this.redisService.set(accessToken, accessToken)
        ]) 
        return { accessToken };
    }

}