import { Camera, FrigateHost } from "@prisma/client";
import { logger } from "../../utils/logger";
import prisma from "../../utils/prisma";
import ConfigService from "../config/config.service";
import { ErrorApp } from "../hooks/error.handler";
import { CreateCameraSchema, UpdateCameraSchema } from "./camera.schema";


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

    async getAllCameras(
        userRoles: string[],
        name: string = '',
        frigateHostId: string = '',
        tagIds: string[] = [],
        offset: number = -1,
        limit: number = -1,
    ) {
        const adminRole = await this.configService.getAdminRole()

        // Build an array of filter conditions
        const filters: any[] = [];


        // Add filter by camera name if provided
        if (name.trim() !== '') {
            filters.push({ name: { contains: name, mode: 'insensitive' } });
        }

        // Add filter by frigate host id if provided
        if (frigateHostId.trim() !== '') {
            filters.push({ frigateHostId: frigateHostId });
        }

        // Add filter by tag ids if provided
        if (tagIds) {
            filters.push({ tagIds: { hasSome: tagIds } });
        }

        // Combine filters with AND operator if any filter exists
        const where = filters.length > 0 ? { AND: filters } : undefined;

        // Add role filter if user is not admin
        if (!adminRole || !userRoles.includes(adminRole.value)) {
            filters.push({ roles: { some: { name: { in: userRoles } } } });
        }

        // Fetch cameras with filters and pagination options
        const cameras = await this.prismaClient.findMany({
            include: {
                frigateHost: true,
                roles: true,
            },
            where: where,
            skip: offset > -1 ? offset : undefined,  // Apply offset if valid
            take: limit > -1 ? limit : undefined,     // Apply limit if valid
        });

        return await this.tagsToCamerasReply(cameras)
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
        const cameras = await this.prismaClient.findMany({
            where: {
                id: { in: cameraIds }
            },
            include: {
                frigateHost: true,
                roles: true
            }
        })
        return await this.tagsToCamerasReply(cameras)
    }

    async getCamera(id: string) {
        const camera = await this.prismaClient.findUniqueOrThrow({
            where: {
                id: id
            },
            include: {
                frigateHost: true,
                roles: true
            }
        })
        return await this.tagsToCameraReply(camera)
    }

    async getCamerState(id: string) {
        return await this.prismaClient.findUniqueOrThrow({
            where: {
                id: id
            },
            select: {
                state: true
            }
        })
    }

    async getCameraByName(name: string) {
        const camera = await this.prismaClient.findFirst({
            where: {
                name: name
            },
            include: {
                frigateHost: true,
                roles: true
            }
        })
        if (camera) {
            return await this.tagsToCameraReply(camera)
        }
    }

    async editCamera(input: UpdateCameraSchema) {
        const { id, ...rest } = input
        const camera = await this.prismaClient.update({
            where: {
                id: id
            },
            data: rest,
            include: {
                frigateHost: true,
                roles: true
            }
        })
        return await this.tagsToCameraReply(camera)
    }

    async addTagToCamera(cameraId: string, tagId: string) {
        prisma.userTags.findUniqueOrThrow({
            where: {
                id: tagId
            }
        })

        const camera = await this.prismaClient.findUniqueOrThrow({
            where: {
                id: cameraId
            }
        })

        if (!camera.tagIds.includes(tagId)) {
            const updatedCamera = await this.prismaClient.update({
                where: {
                    id: cameraId
                },
                data: {
                    tagIds: {
                        push: tagId
                    }
                }
            })

            return await this.tagsToCameraReply(updatedCamera)
        }
        return await this.tagsToCameraReply(camera)
    }

    async deleteTagFromCamera(cameraId: string, tagId: string) {
        prisma.userTags.findUniqueOrThrow({
            where: {
                id: tagId
            }
        })

        const camera = await this.prismaClient.findUniqueOrThrow({
            where: {
                id: cameraId
            },
        })

        if (camera.tagIds.includes(tagId)) {
            const updatedCamera = await this.prismaClient.update({
                where: {
                    id: cameraId
                },
                data: {
                    tagIds: {
                        set: camera.tagIds.filter(id => id !== tagId)
                    }
                }
            })

            return await this.tagsToCameraReply(updatedCamera)
        }

        return await this.tagsToCameraReply(camera)
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

    private async tagsToCamerasReply(cameras: Camera[]) {
        const allTagIds = cameras.flatMap((camera) => camera.tagIds);
        const tags = await prisma.userTags.findMany({
            where: { id: { in: allTagIds } },
        });

        const tagsMap = tags.reduce((acc, tag) => {
            acc[tag.id] = tag;
            return acc;
        }, {} as Record<string, typeof tags[0]>);

        const camerasWithTags = cameras.map((camera) => ({
            ...camera,
            tags: camera.tagIds.map((tagId) => tagsMap[tagId]),
        }));
        return camerasWithTags
    }

    private async tagsToCameraReply(camera: Camera) {
        const tags = await prisma.userTags.findMany({
            where: { id: { in: camera.tagIds } },
            select: {
                id: true,
                value: true
            }
        })
        return {
            ...camera,
            tags: tags,
        }

    }
}


export default CameraService