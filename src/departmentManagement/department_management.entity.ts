import { User } from "../user/user.entity";
import { Column, Entity, JoinColumn, JoinTable, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('department_management')
export class DepartmentManagement { 
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    dep_id: string;

    @OneToOne(() => User)
    @JoinColumn()
    user: User;
}