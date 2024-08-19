import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Class } from "./class.entity";
import { In, Repository } from "typeorm";
import { CreateClassDto } from "./dto/create_class.dto";
import { DepartmentService } from "src/department/department.service";
import { TeacherService } from "src/teacher/teacher.service";
import { StudentService } from "src/student/student.service";
import { GradingCriteria } from "src/grade/gradingCriteria.entity";
import { Grade } from "src/grade/grade.entity";
import { CreateGradeDto } from "src/grade/dto/create_grade.dto";
import { StudentClass } from "src/student/studentClass.entity";

enum classStatus {
    init = "init",
    inProgress = "inProgress",
    finished = "finished"
}

@Injectable()
export class ClassService {
    constructor(
        @InjectRepository(Class)
        private readonly classRepository: Repository<Class>,
        @InjectRepository(GradingCriteria)
        private readonly gradingCriteriaRepository: Repository<GradingCriteria>,
        @InjectRepository(Grade)
        private readonly gradeRepository: Repository<Grade>,
        @InjectRepository(StudentClass)
        private readonly studentClassRepository: Repository<StudentClass>,
        private readonly departmentService: DepartmentService,
        private readonly teacherService: TeacherService,
        private readonly studentService: StudentService
    ) { }

    async createClass(createClassDto: CreateClassDto): Promise<any> {
        const { teacherId, departmentId, name, grade_details, ...classData } = createClassDto;
        const hasClass: boolean = await this.checkExistingClass(name);
        if (hasClass) {
            throw new HttpException(`Class ${name} already exists`, HttpStatus.BAD_REQUEST);
        }
        const [department, teacher] = await Promise.all([
            this.departmentService.findOne(departmentId),
            this.teacherService.findOne(teacherId)
        ]);

        if (!department) {
            throw new HttpException("Department not found", HttpStatus.NOT_FOUND);
        }
        if (!teacher) {
            throw new HttpException("Teacher not found", HttpStatus.NOT_FOUND);
        }
        const newClass = this.classRepository.create({
            ...classData,
            name,
            teacher,
            department,
        });
        await this.classRepository.save(newClass);
        const gradingCriterias = grade_details.map(detail => {
            return this.gradingCriteriaRepository.create({
                name: detail.name,
                weight: detail.weight,
                classEntity: newClass,
            });
        });

        await this.gradingCriteriaRepository.save(gradingCriterias);
        return;
    }

    async deleteClass(classId: number): Promise<any> {
        return this.classRepository.createQueryBuilder()
            .softDelete().where("id = :classId", { classId }).execute();
    }

    async changeClassStatus(class_id: number): Promise<any> {
        return await this.classRepository.createQueryBuilder()
            .update(Class).set({
                status: classStatus.inProgress
            }).where('id = :class_id', { class_id }).execute();
    }

    async getClassesOfTeacher(teacherId: number, page: number = 1, limit: number = 10): Promise<any> {
        const [classes, total] = await this.classRepository.createQueryBuilder('class')
            .innerJoin('class.teacher', 'teacher').where('teacher.userId = :teacherId', { teacherId })
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            classes,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    }

    async checkClassOfTeacher(classId: number, teacherId: number): Promise<boolean> {
        const cls = await this.classRepository.createQueryBuilder('class')
            .innerJoin('class.teacher', 'teacher').where('teacher.userId = :teacherId', { teacherId })
            .andWhere('class.id = :classId', { classId }).getOne();
        return !!cls;
    }

    async checkStudentOfClass(classId: number, studentId: number): Promise<boolean> {
        const student = await this.classRepository.createQueryBuilder('class')
            .innerJoin('class.students', 'student').where('class.id = :classId', { classId })
            .andWhere('student.studentId = :studentId', { studentId }).getOne();
        return !!student;
    }

    async addStudentToClass(studentId: number, classId: number): Promise<any> {
        const [student, cls] = await Promise.all([
            this.studentService.getStudentById(studentId),
            this.classRepository.findOne({
                where: {
                    id: classId
                },
                relations: {
                    students: true
                }
            })
        ]);
        if (!student) {
            throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
        }
        if (!cls) {
            throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
        }
        if (cls.status !== classStatus.init) {
            throw new HttpException('Outside of class registration time', HttpStatus.BAD_REQUEST);
        }
        if (cls.students.length < cls.quantity) {
            cls.students.push(student);
            await this.classRepository.save(cls);
            return;
        }

        throw new HttpException("The class is full", HttpStatus.BAD_REQUEST);
    }

    private async checkExistingClass(name: string): Promise<boolean> {
        const cls = await this.classRepository.findOneBy({ name });
        return !!cls;
    }

    private async getClasseIdsAttended(student_id: number): Promise<number[]> {
        const classes = await this.classRepository.createQueryBuilder('class')
            .innerJoin('class.students', 'student')
            .where('student.userId = :student_id', { student_id }).getMany();
        const ids: number[] = classes.map(cls => cls.id);
        return ids;
    }

    async getClassesForStudent(student_id: number, page: number = 1, limit: number = 10): Promise<any> {
        const [departmentId, attendedClasses] = await Promise.all([
            this.departmentService.getDepartmentByUserId(student_id),
            this.getClasseIdsAttended(student_id)
        ]);

        const [classes, total] = await this.classRepository.createQueryBuilder('class')
            .leftJoinAndSelect('class.students', 'student')
            .leftJoinAndSelect('class.teacher', 'teacher')
            .leftJoinAndSelect('teacher.user', 'user')
            .where('class.departmentId = :departmentId', { departmentId })
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        const results = classes.map(cls => ({
            id: cls.id,
            name: cls.name,
            quantity: cls.quantity,
            remainingSeats: cls.quantity - cls.students.length,
            start_date: cls.start_date,
            end_date: cls.end_date,
            status: attendedClasses.includes(cls.id) ? "joined" : "not joined",
            teacher: {
                teacher_id: cls.teacher.userId,
                teacher_name: `${cls.teacher.user.first_name} ${cls.teacher.user.last_name}`
            }
        }))

        return {
            results,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    }

    async getClassesAttened(student_id: number, page: number = 1, limit: number = 10): Promise<any> {
        const [classes, total] = await this.classRepository.createQueryBuilder('class')
            .innerJoin('class.teacher', 'teacher')
            .innerJoin('class.students', 'student')
            .innerJoin('teacher.user', 'user')
            .select([
                'class.id',
                'class.name',
                'class.start_date',
                'class.end_date',
                'teacher.userId',
                'user.first_name',
                'user.last_name',
            ])
            .where('student.userId = :student_id', { student_id })
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            classes,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    }

    async getClassesOfDepartment(dep_id: number, page: number = 1, limit: number = 10): Promise<any> {
        const results = await this.classRepository.createQueryBuilder('class')
            .innerJoin('class.department', 'department')
            .innerJoin('class.teacher', 'teacher')
            .innerJoin('class.students', 'student')
            .innerJoin('teacher.user', 'user')
            .select([
                'class.id',
                'class.name',
                'class.quantity',
                'class.start_date',
                'class.end_date',
                'teacher.userId',
                'user.first_name',
                'user.last_name',
                'COUNT(class.id) as count'
            ])
            .where('department.id = :dep_id', { dep_id })
            .groupBy('class.id')
            .skip((page - 1) * limit)
            .take(limit)
            .getRawMany();

        const totalRecords = await this.classRepository.createQueryBuilder('class')
            .innerJoin('class.department', 'department')
            .where('department.id = :dep_id', { dep_id })
            .getCount();

        return {
            classes: results.map(result => ({
                id: result.class_id,
                name: result.class_name,
                quantity: result.class_quantity,
                start_date: result.class_start_date,
                end_date: result.class_end_date,
                teacher_name: `${result.user_first_name} ${result.user_last_name}`,
                student_count: parseInt(result.count, 10)
            })),
            total: totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page
        };
    }

    async getGradeCriteriaOfClass(class_id: number): Promise<any> {
        const criterias = await this.classRepository.find({
            where: {
                id: class_id
            },
            relations: {
                gradingCriteria: true
            },
            select: {
                id: true,
                gradingCriteria: true
            }
        })
        if (!criterias) {
            throw new HttpException('No criteria found for class', HttpStatus.NOT_FOUND);
        }
        return criterias;
    }

    async createGrade(classId: number, createGradeDtos: CreateGradeDto[]): Promise<any> {
        const studentIds = createGradeDtos.map(dto => dto.studentId);
        const [studentClasses, gradingCriterias] = await Promise.all([
            this.studentClassRepository.find({
                where: {
                    student: {
                        userId: In(studentIds)
                    },
                    classEntity: {
                        id: classId
                    }
                },
                relations: ['student', 'classEntity']
            }),
            this.gradingCriteriaRepository.find(
                {
                    where: {
                        classEntity: {
                            id: classId
                        }
                    }
                }
            )
        ])

        if (!studentClasses) {
            throw new HttpException('Student or class not found', HttpStatus.NOT_FOUND);
        }
        if (studentClasses[0].classEntity.status !== classStatus.inProgress) {
            throw new HttpException('Out of grade update time', HttpStatus.BAD_REQUEST);
        }
        if (!gradingCriterias) {
            throw new HttpException('Grading Criteria not found', HttpStatus.NOT_FOUND);
        }

        const grades = [];
        const gradingCriteriaLength = gradingCriterias.length

        for (let i = 0; i < createGradeDtos.length; i += gradingCriteriaLength) {
            const dtoGroup = createGradeDtos.slice(i, i + gradingCriteriaLength);
            const scores = dtoGroup.map((dto, index) => {
                if (dto.score === undefined) {
                    throw new Error(`Score is missing in DTO at index ${index}`);
                }
                return dto.score;
            });
            const studentClass = studentClasses[Math.floor((i + 1) / gradingCriteriaLength)];

            for (let j = 0; j < scores.length; j++) {
                const newGrade = this.gradeRepository.create({
                    gradingCriteria: gradingCriterias[j],
                    studentClass,
                    score: scores[j],
                });
                grades.push(newGrade);
            }
        }
        studentClasses[0].classEntity.status = classStatus.finished;
        await Promise.all([
            this.gradeRepository.save(grades),
            this.classRepository.save(studentClasses[0].classEntity)
        ]);
        return;
    }

    async getGradesOfClass(classId: number, page: number = 1, limit: number = 10): Promise<any> {
        const [studentGrades, total] = await Promise.all([
            this.classRepository.createQueryBuilder('class')
                .innerJoin('class.students', 'student')
                .innerJoin('student.user', 'user')
                .innerJoin('class.gradingCriteria', 'gradingCriteria')
                .innerJoin('gradingCriteria.grades', 'grade')
                .where('class.id = :classId', { classId })
                .select([
                    'student.userId AS id',
                    'user.first_name AS first_name',
                    'user.last_name AS last_name',
                    'gradingCriteria.name AS criteriaName',
                    'gradingCriteria.weight AS weight',
                    'grade.score AS score'
                ])
                .orderBy('user.last_name')
                .skip((page - 1) * limit)
                .take(limit)
                .getRawMany(),
            this.classRepository.createQueryBuilder('class')
                .innerJoin('class.students', 'student')
                .innerJoin('student.user', 'user')
                .innerJoin('class.gradingCriteria', 'gradingCriteria')
                .innerJoin('gradingCriteria.grades', 'grade')
                .where('class.id = :classId', { classId })
                .getCount()
        ])

        const result = studentGrades.reduce((acc: any, curr: any) => {
            if (!acc[curr.id]) {
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

    async getAllGradesOfStudent(studentId: number, page: number = 1, limit: number = 10): Promise<any> {
        const [studentGrades, total] = await Promise.all([
            this.classRepository.createQueryBuilder('class')
                .innerJoin('class.students', 'student')
                .innerJoin('student.user', 'user')
                .innerJoin('class.gradingCriteria', 'gradingCriteria')
                .innerJoin('gradingCriteria.grades', 'grade')
                .where('student.userId = :studentId', { studentId })
                .select([
                    'class.id AS classId',
                    'class.name AS className',
                    'gradingCriteria.name AS criteriaName',
                    'gradingCriteria.weight AS weight',
                    'grade.score AS score'
                ])
                .orderBy('class.name')
                .addOrderBy('gradingCriteria.name')
                .skip((page - 1) * limit)
                .take(limit)
                .getRawMany(),
            this.classRepository.createQueryBuilder('class')
                .innerJoin('class.students', 'student')
                .innerJoin('student.user', 'user')
                .innerJoin('class.gradingCriteria', 'gradingCriteria')
                .innerJoin('gradingCriteria.grades', 'grade')
                .where('student.userId = :studentId', { studentId })
                .getCount()
        ]);

        const result = studentGrades.reduce((acc: any, curr: any) => {
            let existingClass = acc.find((cls: any) => cls.classId === curr.classId);

            if (!existingClass) {
                existingClass = {
                    classId: curr.classId,
                    className: curr.className,
                    grades: [],
                    avgScore: 0
                };
                acc.push(existingClass);
            }


            const existingCriteria = existingClass.grades.find((g: any) => g.criteriaName === curr.criteriaName);
            if (!existingCriteria) {
                existingClass.grades.push({
                    criteriaName: curr.criteriaName,
                    score: curr.score,
                    weight: curr.weight
                });
                existingClass.avgScore += curr.score * (curr.weight / 100);
            }
            return acc;
        }, []);
        const formattedResult = Object.values(result);
        formattedResult.forEach((student: any) => {
            student.avgScore = parseFloat(student.avgScore.toFixed(2));
        });
        return {
            classes: result,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    }

    async getGradeOfStudent(classId: number, studentId: number, page: number = 1, limit: number = 10): Promise<any> {
        const [studentGrades, total] = await Promise.all([
            this.classRepository.createQueryBuilder('class')
                .innerJoin('class.students', 'student')
                .innerJoin('student.user', 'user')
                .innerJoin('class.gradingCriteria', 'gradingCriteria')
                .innerJoin('gradingCriteria.grades', 'grade')
                .where('student.userId = :studentId', { studentId })
                .andWhere('class.id = :classId', { classId })
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
            this.classRepository.createQueryBuilder('class')
                .innerJoin('class.students', 'student')
                .innerJoin('student.user', 'user')
                .innerJoin('class.gradingCriteria', 'gradingCriteria')
                .innerJoin('gradingCriteria.grades', 'grade')
                .where('student.userId = :studentId', { studentId })
                .andWhere('class.id = :classId', { classId })
                .getCount()
        ]);

        const result = studentGrades.reduce((acc: any, curr: any) => {
            if (!acc[curr.id]) {
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
        formattedResult.forEach((student: any) => {
            student.avgScore = parseFloat(student.avgScore.toFixed(2));
        });

        return {
            students: formattedResult,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    }

}