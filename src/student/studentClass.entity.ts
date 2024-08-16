import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { Student } from './student.entity';
import { Class } from 'src/class/class.entity';


@Entity('student_classes')
@Unique(['student', 'classEntity'])
export class StudentClass {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Student, student => student.classes)
    student: Student;

    @ManyToOne(() => Class, classEntity => classEntity.students)
    classEntity: Class;

}
