import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DepartmentManagement } from "./department_management.entity";
import { Repository } from "typeorm";

@Injectable()
export class DepartmentManagementService { 
    constructor(
        @InjectRepository(DepartmentManagement)
        private readonly departmentManagementService: Repository<DepartmentManagement>
    ) { }
    
    async getDepartmentIdOfAdmin(id: number): Promise<number[]> {
        const ids = await this.departmentManagementService.find({
            select: {
                dep_id: true
            },
            relations: {
                user: true
            },
            where: {
                user: {
                    id,
                }
            }
        });
        
        const idArr: string[] = ids[0].dep_id.split(',');
        
        return idArr.map(id => parseInt(id))
    }
}