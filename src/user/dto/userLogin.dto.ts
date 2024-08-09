import { IsNotEmpty, Matches, MinLength } from "class-validator";

export class UserLoginDto{
    @IsNotEmpty({message: "Username must not be empty"})
    username: string;
    @IsNotEmpty({message: "Password must not be empty"})
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character, and must be at least 8 characters long.',
    })
    password: string;
}


