import { IsNotEmpty } from "class-validator";
export class EditUserDto {
    @IsNotEmpty({ message: 'first name is required' })
    first_name: string;
    @IsNotEmpty({ message: 'last name is required' })
    last_name: string;
    @IsNotEmpty({ message: 'username is required' })
    username: string;
    dob: Date;
    gender: string;
    address: string;
}
