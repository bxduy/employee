import { isNotEmpty, IsNotEmpty, Matches, MinLength } from "class-validator";

export class CreateUserDto{
    @IsNotEmpty({ message: 'first name is required' })
    first_name: string;
    @IsNotEmpty({ message: 'last name is required' })
    last_name: string;
    @IsNotEmpty({ message: 'username is required' })
    username: string;
    @IsNotEmpty({ message: 'password is required' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character, and must be at least 8 characters long.',
    })
    password: string;
    dob: Date;
    gender: string;
    address: string;
    @IsNotEmpty()
    roleId: number;
    @IsNotEmpty()
    departmentId: number;
}