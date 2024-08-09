import { DepartmentManagement } from "../departmentManagement/department_management.entity";
import { Department } from "../department/department.entity";
import { Role } from "../role/role.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column()
    username: string;

    @Column()
    password?: string;

    @Column()
    dob: Date

    @Column()
    address: string;

    @Column()
    gender: string;

    @Column()
    access_token: string;

    @Column()
    refresh_token: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
    
    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deleted_at?: Date;

    @ManyToOne(() => Role, (role) => role.users)
    role: Role

    @ManyToOne(() => Department, (department) => department.users)
    department: Department


}