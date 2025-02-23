import { Camera } from "@prisma/client";
import { logger } from "../../utils/logger";
import prisma from "../../utils/prisma";
import ConfigService from "../config/config.service";
import { CreateCameraSchema, UpdateCameraSchema } from "./camera.schema";

class CameraService {
    private static _instance: CameraService

    private prismaClient = prisma.camera
    private configService = ConfigService.getInstance()

    constructor() {
        logger.debug(`CameraService initialized`)
    }

    public static getInstance() {
        if (!CameraService._instance) {
            CameraService._instance = new CameraService()
        }
        return CameraService._instance
    }

    async createCamera(input: CreateCameraSchema) {
        const camera = await this.prismaClient.create({
            data: input,
            include: {
                frigateHost: true,
                roles: true
            }
        })
        return await this.addTagsToCameraReply(camera)
    }

    async getAllCameras(
        userRoles: string[],
        name: string = '',
        frigateHostId: string = '',
        tagIds: string[] = [],
        offset: number = -1,
        limit: number = -1,
        userId: string = '',
    ) {

        // Build an array of filter conditions
        const filters: any[] = [];


        // Add role filter if adminRole is not empty or user is not admin
        const rolesFilter = await this.getPrismaRolesFilter(userRoles)
        if (rolesFilter) filters.push(rolesFilter)


        // Add filter by camera name if provided
        if (name.trim() !== '') {
            filters.push({ name: { contains: name, mode: 'insensitive' } });
        }

        // Add filter by frigate host id if provided
        if (frigateHostId.trim() !== '') {
            filters.push({ frigateHostId: frigateHostId });
        }

        // Add filter by tag ids if provided
        if (tagIds && tagIds.length > 0) {
            // Filter cameras that have at least one of the provided tag ids
            filters.push({ tagIds: { hasSome: tagIds } });
        }

        // Combine filters with AND operator if any filter exists
        const where = filters.length > 0 ? { AND: filters } : undefined;

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

        return await this.addTagsToCamerasReply(cameras, userId)
    }

    async getCamera(
        id: string,
        userRoles: string[],
    ) {
        const rolesFilter = await this.getPrismaRolesFilter(userRoles)
        const camera = await this.prismaClient.findUniqueOrThrow({
            where: { id: id, AND: rolesFilter },
            include: {
                frigateHost: true,
                roles: true
            }
        })
        return await this.addTagsToCameraReply(camera)
    }

    async getCameraState(id: string) {
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
            return await this.addTagsToCameraReply(camera)
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
        return await this.addTagsToCameraReply(camera)
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

            return await this.addTagsToCameraReply(updatedCamera)
        }
        return await this.addTagsToCameraReply(camera)
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

            return await this.addTagsToCameraReply(updatedCamera)
        }

        return await this.addTagsToCameraReply(camera)
    }

    async deleteCamera(
        id: string,
        userRoles: string[]
    ) {
        const camera = await this.getCamera(id, userRoles)
        const deletedCamera = await this.prismaClient.delete({
            where: {
                id: camera.id
            },
            include: {
                frigateHost: true,
                roles: true
            }
        })
        return await this.addTagsToCameraReply(deletedCamera)
    }

    async getCamerasByRole(roleId: string) {
        const cameras = await this.prismaClient.findMany({
            where: {
                rolesIDs: {
                    has: roleId
                }
            }
        })
        return await this.addTagsToCamerasReply(cameras)
    }

    async getCamerasByRoles(rolesIds: string[]) {
        const cameras = await this.prismaClient.findMany({
            where: {
                rolesIDs: {
                    hasSome: rolesIds
                }
            }
        })
        return await this.addTagsToCamerasReply(cameras)
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


    private async getCamerasByIds(
        cameraIds: string[],
    ) {
        const cameras = await this.prismaClient.findMany({
            where: { id: { in: cameraIds } },
            include: {
                frigateHost: true,
                roles: true
            }
        })
        return await this.addTagsToCamerasReply(cameras)
    }

    private async addTagsToCamerasReply(cameras: Camera[], userId: string = '') {
        const allTagIds = cameras.flatMap((camera) => camera.tagIds);
        const tags = await prisma.userTags.findMany({
            where: {
                id: { in: allTagIds },
                userId: userId || undefined,
            },
        });

        logger.debug(`tags: ${JSON.stringify(tags)}`)

        const tagsMap = tags.reduce((acc, tag) => {
            acc[tag.id] = tag;
            return acc;
        }, {} as Record<string, typeof tags[0]>);

        const camerasWithTags = cameras.map((camera) => {
            const foundTags = camera.tagIds
                .map((tagId) => tagsMap[tagId])
                .filter(Boolean)
            return {
                ...camera,
                tags: foundTags.length > 0 ? foundTags : [],
            }
        });
        return camerasWithTags
    }

    private async addTagsToCameraReply(camera: Camera) {
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

    private async getPrismaRolesFilter(roles: string[]) {
        if (!(await this.isAdminOrEmpty(roles))) {
            return { roles: { some: { name: { in: roles } } } }
        }
        return undefined
    }

    private async isAdminOrEmpty(roles: string[]) {
        const adminRole = await this.configService.getAdminRole()
        return !adminRole || roles.includes(adminRole.value)
    }
}


export default CameraService