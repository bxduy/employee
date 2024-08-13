import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { File } from "./file.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { v4 as uuidv4 } from "uuid"
import path, { dirname, extname } from "path";
import { User } from "src/user/user.entity";
import cloudinary from "src/config/cloudinary.config";

@Injectable()
export class FileService { 
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>
    ) { }
    
    async saveFile(fileName: string, filePath: string, location: string, user: User): Promise<any> {
        return await this.fileRepository.insert({
            name: fileName,
            url: filePath,
            location,
            user
        });
    }

    async saveCloud(file: Express.Multer.File, location: string, user: User): Promise<any> { 
        const uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'images',
        })
        const url = uploadResult.secure_url;
        return await this.fileRepository.insert({
            name: file.filename,
            url,
            location,
            user
        });
    }
}