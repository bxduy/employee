import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "./role.entity";
import { Repository } from "typeorm";

@Injectable()
export class RoleService{
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>
    ) { }
    async findOne(id: number): Promise<Role>{
        return await this.roleRepository.findOneBy({ id });
    }
}