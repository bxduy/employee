import { applyDecorators, SetMetadata } from "@nestjs/common";

export function Auth(permissions: string[]) {
    return applyDecorators(
        SetMetadata('permissions', permissions)
    )
}