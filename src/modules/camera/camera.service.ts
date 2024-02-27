import { Camera, Role } from "@prisma/client";
import prisma from "../../utils/prisma";
import { ErrorApp } from "../hooks/error.handler";
import { CreateCameraSchema, UpdateCameraSchema } from "./camera.schema";
import { logger } from "../../utils/logger";
import { init } from "i18next";
import { sleep } from "../../utils/sleep";
import ConfigService from "../config/config.service";


class CameraService {
    private prismaClient = prisma.camera
    private configService = ConfigService.getInstance()

    constructor() {
        logger.debug(`CameraService initialized`)
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

    async getAllCameras(userRoles: string[]) {
        const adminRole = await this.configService.getAdminRole()
        if (!adminRole || userRoles.find(role => role === adminRole.value)) {
            return await this.prismaClient.findMany({
                include: {
                    frigateHost: true,
                    roles: true
                }
            })
        }
        return await this.prismaClient.findMany({
            where: {
                roles: {
                    some: {
                        name: {
                            in: userRoles
                        }
                    }
                }
            },
            include: {
                frigateHost: true,
                roles: true
            }
        })
    }

    async getAllCamerasByHost(userRoles: string[], hostId: string) {
        const adminRole = await this.configService.getAdminRole()
        if (!adminRole || userRoles.find(role => role === adminRole.value)) {
            return await this.prismaClient.findMany({
                where: {
                    frigateHostId: hostId
                },
                include: {
                    frigateHost: true,
                    roles: true
                }
            })
        }
        return await this.prismaClient.findMany({
            where: {
                frigateHostId: hostId,
                roles: {
                    some: {
                        name: {
                            in: userRoles
                        }
                    }
                }
            },
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

    async getCameraByName(name: string) {
        return await this.prismaClient.findFirst({
            where: {
                name: name
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
        if (host) throw new ErrorApp('validate', 'CameraService Cannot delete frigate camera. Host is exist')
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
        return await Promise.all(cameras.map(async (camera) => {
            const updatedRolesIDs = camera.rolesIDs.filter(roleId => !rolesId.includes(roleId));
            return await this.prismaClient.update({
                where: { id: camera.id },
                data: { rolesIDs: updatedRolesIDs }
            });
        }));
    }

    async addRoles(camerasId: string[], rolesId: string[]) {
        const cameras = await this.getCamerasByIds(camerasId)
        return await Promise.all(cameras.map(camera => {
            const updatedRolesIDs = [...new Set([...camera.rolesIDs, ...rolesId])];
            logger.debug(`CameraService Camera add roles: ${updatedRolesIDs}`)
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