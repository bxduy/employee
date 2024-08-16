import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Student } from "./student.entity";
import { Repository } from "typeorm";
import { User } from "src/user/user.entity";

@Injectable()
export class StudentService { 
    constructor(
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>
    ) { }
    async createStudent(user: User): Promise<any> { 
        const student = this.studentRepository.create({ user });
        return await this.studentRepository.save(student);
    }

    async getStudents(classId: number, page: number = 1, limit: number = 10): Promise<any> {
        const [students, total] = await this.studentRepository.createQueryBuilder('student')
            .innerJoin('student.user', 'user')
            .innerJoin('student.classes', 'class')
            .where('class.id = :classId', { classId })
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        if (!students) {
            throw new HttpException('Students not found', HttpStatus.NOT_FOUND);
        }
        return {
            students,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    }

    async getStudentById(studentId: number, classId?: number): Promise<Student> {
        if (!classId) {
            return await this.studentRepository.findOne({
                where: {
                    userId: studentId,
                },
            });
        }
        const student = await this.studentRepository.createQueryBuilder('student')
            .innerJoin('student.user', 'user')
            .innerJoin('student.classes', 'class')
            .where('class.id = :classId', { classId })
            .andWhere('student.userId = :studentId', { studentId })
            .select([
                'user.id as id',
                'user.first_name as first_name',
                'user.last_name as last_name',
                'user.gender as gender',
                'user.address as address',
                'user.dob as dob'
            ])
            .getOne();
        if (!student) {
            throw new HttpException("Student not found", HttpStatus.NOT_FOUND);
        }
        return student;
    }
}