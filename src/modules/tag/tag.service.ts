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
        const { id, ...rest } = tag

        const updatedTag = await this.prismaClient.upsert({
            where: { value_userId: { value: tag.value, userId } },
            update: {
                userId,
                ...rest,
            },
            create: {
                userId,
                ...rest,
            },
        })

        await Promise.all(
            tag.cameraIds.map(async (cameraId) => {
                await prisma.camera.update({
                    where: { id: cameraId },
                    data: {
                        tagIds: { push: updatedTag.id },
                    },
                });
            })
        )

        return updatedTag
    }

    async getAllTags(userId: string) {
        return await this.prismaClient.findMany({
            where: {
                userId
            },
        })
    }

    async getTag(tagId: string, userId: string) {
        return await this.prismaClient.findUnique({
            where: {
                id: tagId,
                userId
            },
        })
    }

    async deleteTag(tagId: string, userId: string) {

        const tag = await this.prismaClient.findUniqueOrThrow({
            where: { id: tagId },
            select: { cameraIds: true },
        })

        await Promise.all(
            tag.cameraIds.map(async (cameraId) => {
                const camera = await prisma.camera.findUniqueOrThrow({
                    where: { id: cameraId },
                    select: { tagIds: true },
                });

                await prisma.camera.update({
                    where: { id: cameraId },
                    data: {
                        tagIds: {
                            set: camera.tagIds.filter((id) => id !== tagId),
                        },
                    },
                })
            })
        )

        return await this.prismaClient.delete({
            where: {
                id: tagId,
                userId,
            },
        });
    }
}

export default TagService