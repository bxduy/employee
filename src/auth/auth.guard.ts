import { ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PermissionsService } from "../permission/permission.service";
import { Reflector } from "@nestjs/core";
import { DepartmentManagementService } from "src/departmentManagement/department_management.service";
import { UserService } from "src/user/user.service";
import { RedisService } from "src/redis/redis.service";
import { DepartmentService } from "src/department/department.service";

@Injectable()
export class AuthGuard {
    constructor(
        private readonly jwtService: JwtService,
        private readonly permissionService: PermissionsService,
        private readonly departmentManagementService: DepartmentManagementService,
        private readonly userService: UserService,
        private readonly redisService: RedisService,
        private readonly departmentService: DepartmentService,
        private reflector: Reflector
    ) { }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            return false;
        }
        const token = authHeader.split(' ')[1];

        try {
            const checkExistingToken = await Promise.any([
                this.userService.checkExistingToken(token, 'access_token'),
                this.redisService.get(token)
            ])
            if (!checkExistingToken) {
                return false;
            }
            const decodedToken = this.jwtService.verify(token);
            const userId = decodedToken.id;
            const depId = +request.params.dep_id;
            const empId = +request.params.emp_id;
            
            if (requiredPermissions && depId) {
                const userDepartments = await this.departmentManagementService.getDepartmentIdOfAdmin(userId);
                let hasDepartment = this.checkDepartmentManagement(userDepartments, depId);
                
                if (!hasDepartment) {
                    return false;
                }
                if (empId) {
                    const empDepartment = await this.departmentService.getDepartmentByUserId(empId);
                    if (empDepartment !== depId) { 
                        return false;
                    }
                }
                const userPermissions = await this.getUserPermissions(userId);
                const hasPermission = this.checkPermissions(userPermissions, requiredPermissions);
                if (!hasPermission) {
                    return false;
                }
            }
            request.user = decodedToken;
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    private async getUserPermissions(userId: number): Promise<string[]> {
        const permissions: any[] = await this.permissionService.getPermissions(userId);
        return permissions.map(permission => permission.name);
    }

    private checkPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
        return requiredPermissions.every(permission => userPermissions.includes(permission));
    }

    private checkDepartmentManagement(userDepartments: number[], depId: number): boolean {
        return userDepartments.includes(depId);
    }
}