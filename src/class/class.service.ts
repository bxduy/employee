import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Class } from "./class.entity";
import { Repository } from "typeorm";
import { CreateClassDto } from "./dto/create_class.dto";
import { DepartmentService } from "src/department/department.service";
import { TeacherService } from "src/teacher/teacher.service";
import { StudentService } from "src/student/student.service";
import { GradingCriteria } from "src/grade/gradingCriteria.entity";

enum classStatus {
    init = "init",
    inProgress = "inProgress",
    finished = "finished"
}

@Injectable()
export class ClassService{
    constructor(
        @InjectRepository(Class)
        private readonly classRepository: Repository<Class>,
        @InjectRepository(GradingCriteria)
        private readonly gradingCriteriaRepository: Repository<GradingCriteria>,
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
            .innerJoin('class.teacher', 'teacher').where('teacher.teacherId = :teacherId', { teacherId })
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
            .innerJoin('class.teacher', 'teacher').where('teacher.teacherId = :teacherId', { teacherId })
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
    
}