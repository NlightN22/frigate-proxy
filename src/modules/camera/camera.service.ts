import { Camera } from "@prisma/client";
import prisma from "../../utils/prisma";
import { ErrorApp } from "../hooks/error.handler";
import { CreateCameraSchema, UpdateCameraSchema } from "./camera.schema";
import { logger } from "../../utils/logger";


class CameraService {
    private prismaClient = prisma.camera

    constructor () {
        logger.debug(`FrigateHostsService initialized`)
    }

    async createCamera(input: CreateCameraSchema) {
        return await this.prismaClient.create({
            data: input,
            include: {
                frigateHost: true,
                roles: true
            }
        })
    }

    async getAllCameras() {
        return await this.prismaClient.findMany({
            include: {
                frigateHost: true,
                roles: true
            }
        })
    }
    async getCamerasByIds(cameraIds: string[]) {
        return await this.prismaClient.findMany({
            where: {
                id: { in: cameraIds }
            },
            include: {
                frigateHost: true,
                roles: true
            }
        })
    }

    async getCamera(id: string) {
        return await this.prismaClient.findUniqueOrThrow({
            where: {
                id: id
            },
            include: {
                frigateHost: true,
                roles: true
            }
        })
    }

    async editCamera(input: UpdateCameraSchema) {
        const { id, ...rest } = input
        return await this.prismaClient.update({
            where: {
                id: id
            },
            data: rest,
            include: {
                frigateHost: true,
                roles: true
            }
        })
    }

    async deleteCamera(id: string) {
        const camera = await this.getCamera(id)
        let host
        if (camera.frigateHostId) {
            // host = await frigateHostsService.getFrigateHostOrNull(camera.frigateHostId)
        }
        if (host) throw new ErrorApp('validate', 'Cannot delete frigate camera. Host is exist')
        return await this.prismaClient.delete({
            where: {
                id: id
            },
            include: {
                frigateHost: true,
                roles: true
            }
        })
    }

    async getCamerasByRole(roleId: string) {
        return await this.prismaClient.findMany({
            where: {
                rolesIDs: {
                    has: roleId
                }
            }
        })
    }

    async getCamerasByRoles(rolesIds: string[]) {
        return await this.prismaClient.findMany({
            where: {
                rolesIDs: {
                    hasSome: rolesIds
                }
            }
        })
    }

    async deleteRoles(camerasId: string[], rolesId: string[]) {
        const cameras = await this.getCamerasByIds(camerasId)
        await Promise.all(cameras.map(async (camera) => {
            const updatedRolesIDs = camera.rolesIDs.filter(roleId => !rolesId.includes(roleId));
            return await this.prismaClient.update({
                where: { id: camera.id },
                data: { rolesIDs: updatedRolesIDs }
            });
        }));
    }

    async addRoles(camerasId: string[], rolesId: string[]) {
        const cameras = await this.getCamerasByIds(camerasId)
        await Promise.all(cameras.map(camera => {
            const updatedRolesIDs = [...new Set([...camera.rolesIDs, ...rolesId])];
            logger.debug(`Camera add roles: ${updatedRolesIDs}`)
            return this.prismaClient.update({
                where: {
                    id: camera.id
                },
                data: {
                    rolesIDs: updatedRolesIDs
                }
            });
        }));
    }
}

export default CameraService