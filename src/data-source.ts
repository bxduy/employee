import { DataSource } from 'typeorm';
import { User } from './user/user.entity';
import { Role } from './role/role.entity'; 
import { Permission } from './permission/permission.entity';
import { Department } from './department/department.entity';
import { DepartmentManagement } from './departmentManagement/department_management.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '1312002',
  database: 'employee',
  entities: [User, Role, Permission, Department, DepartmentManagement],
  migrations: ['./migrations/**/*{.ts,.js}'],
  synchronize: false, // Set this to false if using migrations
});