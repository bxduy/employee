import { Class } from 'src/class/class.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';


@Entity('grading_criteria')
export class GradingCriteria {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Class, classEntity => classEntity.gradingCriteria)
    classEntity: Class;

    @Column()
    name: string;

    @Column()
    weight: number;
}
