import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Department } from "./department.entity";
import { In, Repository } from "typeorm";

@Injectable()
export class DepartmentService { 
    constructor(
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>
    ) { }
    
    async getDepartmentOfAdmin(ids: number[]): Promise<any> {
        const departments = await this.departmentRepository.findBy(
            {
                id: In(ids),
            }
        );
        const result: Department[] = [];
        departments.forEach(department => {
            const dep: Department = {
                id: department.id,
                name: department.name
            }
            result.push(dep);
        })
        return result;
    }

    async findOne(id: number): Promise<Department> { 
        return this.departmentRepository.findOneBy({ id });
    }

    async getDepartmentByUserId(userId: number): Promise<number> {
        const department = await this.departmentRepository.createQueryBuilder('department')
            .innerJoin('department.users', 'user')
            .where('user.id = :id', { id: userId }).execute();
        
        return department[0].department_id;
    }
}