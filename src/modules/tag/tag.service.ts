import { logger } from "../../utils/logger"
import prisma from "../../utils/prisma"
import CameraService from "../camera/camera.service"
import { PutTagCameraSchema } from "./tag.schema"

class TagService {
    private static _instance: TagService
    cameraService = new CameraService()
    prismaClient = prisma.userTags

    public static getInstance() {
        if (!TagService._instance) {
            TagService._instance = new TagService()
        }
        return TagService._instance
    }

    constructor() {
        logger.debug(`TagsService initialized`)
    }

    async upsertTag(tag: PutTagCameraSchema, userId: string) {
        const { id, cameras, ...rest } = tag
        return this.prismaClient.upsert({
            where: { id: tag.id },
            update: {
                userId,
                ...rest,
                cameras: {
                    connect: cameras.map((camera) => ({ id: camera.id }))
                }
            },
            create: {
                userId,
                ...rest,
                cameras: {
                    connect: [],
                }
            }
        })
    }

    async getAllTags(userId: string) {
        return await this.prismaClient.findMany({
            where: {
                userId
            },
            include: {
                cameras: true
            }
        })
    }

    async getTag(tagId: string, userId: string) {
        return await this.prismaClient.findUnique({
            where: {
                id: tagId,
                userId
            },
            include: {
                cameras: true
            }
        })
    }

    async deleteTag(tagId: string, userId: string) {

        await prisma.cameraTag.deleteMany({
            where: { tagId }
        })

        return await this.prismaClient.delete({
            where: {
                id: tagId,
                userId
            }
        })
    }

}

export default TagService