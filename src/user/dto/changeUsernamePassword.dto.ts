import { IsNotEmpty, MinLength, Matches } from "class-validator";

export class ChangeUsernamePasswordDto{
    @IsNotEmpty({ message: "Username must not be empty" })
    username: string;
    @IsNotEmpty({ message: "Old password must be not empty"})
    oldPassword: string;
    @IsNotEmpty({ message: "Passwords must be not empty"})
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character, and must be at least 8 characters long.',
    })
    newPassword: string;
    @IsNotEmpty({message: "Confirm password must not be empty"})
    confirmPassword: string;
}