import { Class } from "src/class/class.entity";
import { User } from "src/user/user.entity";
import { Entity, JoinColumn, JoinTable, ManyToMany, OneToOne, PrimaryColumn } from "typeorm";

@Entity('students')
export class Student{
    @PrimaryColumn()
    userId: number; 

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId' }) 
    user: User;

    @ManyToMany(() => Class, (cls) => cls.students)
    @JoinTable({
        name: 'student_classes',
        joinColumn: {
            name: 'studentId',
            referencedColumnName: 'userId',
        },
        inverseJoinColumn: {
            name: 'classId',
            referencedColumnName: 'id',
        },
    })
    classes: Class[];
}