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
            .select([
                'student.userId',
                'user.id',
                'user.first_name',
                'user.last_name',
            ])
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

    async getGradesOfStudent(studentId: number, page: number = 1, limit: number = 10): Promise<any> {
        const [studentGrades, total] = await Promise.all([
            this.studentRepository.createQueryBuilder('student')
                .innerJoin('student.classes', 'class')
                .innerJoin('student.user', 'user')
                .innerJoin('class.gradingCriteria', 'gradingCriteria')
                .innerJoin('gradingCriteria.grades', 'grade')
                .where('student.userId = :studentId', { studentId })
                .select([
                    'student.userId AS id',
                    'user.first_name AS first_name',
                    'user.last_name AS last_name',
                    'gradingCriteria.name AS criteriaName',
                    'gradingCriteria.weight AS weight',
                    'grade.score AS score'
                ])
                .orderBy('gradingCriteria.name')
                .skip((page - 1) * limit)
                .take(limit)
                .getRawMany(),
            this.studentRepository.createQueryBuilder('student')
                .innerJoin('student.classes', 'class')
                .innerJoin('student.user', 'user')
                .innerJoin('class.gradingCriteria', 'gradingCriteria')
                .innerJoin('gradingCriteria.grades', 'grade')
                .where('student.userId = :studentId', { studentId })
                .getCount()
        ]);

        const result = studentGrades.reduce((acc: any, curr: any) => {
            if (!acc.id) {
                acc[curr.id] = {
                    id: curr.id,
                    first_name: curr.first_name,
                    last_name: curr.last_name,
                    grades: [],
                    avgScore: 0
                };
            }

            const existingCriteria = acc[curr.id].grades.find((g: any) => g.criteriaName === curr.criteriaName);
            if (!existingCriteria) {
                acc[curr.id].grades.push({
                    criteriaName: curr.criteriaName,
                    score: curr.score,
                    weight: curr.weight
                });
                acc[curr.id].avgScore += curr.score * (curr.weight / 100);
            }

            return acc;
        }, {});



        const formattedResult = Object.values(result);

        return {
            students: formattedResult,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    }
}