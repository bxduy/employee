import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Student } from "./student.entity";
import { StudentService } from "./student.service";
import { UserModule } from "src/user/user.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Student]),
        forwardRef(() => UserModule)
    ],
    providers: [StudentService],
    exports: [StudentService]
})
export class StudentModule { }