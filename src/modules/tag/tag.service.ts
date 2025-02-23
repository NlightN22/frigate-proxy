import { logger } from "../../utils/logger"
import prisma from "../../utils/prisma"
import CameraService from "../camera/camera.service"
import { ErrorApp } from "../hooks/error.handler"
import { PutTagSchema } from "./tag.schema"

class TagService {
    private static _instance: TagService
    cameraService = CameraService.getInstance()
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

    async upsertTag(tag: PutTagSchema, userId: string) {
        const { id, ...rest } = tag

        const isTagExists = await this.prismaClient.findFirst({
            where: {
                value: tag.value,
                userId: userId
            }
        })

        if (!isTagExists) {
            await this.validateMaxTagsForUser(userId)
            return await this.prismaClient.create({
                data: {
                    userId,
                    ...rest,
                }
            })
        }

        return await this.prismaClient.update({
            where: { value_userId: { value: tag.value, userId } },
            data: {
                ...rest
            }
        })

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
            where: { id: tagId, userId }
        })

        this.removeTagFromCameras(tag.id)

        return await this.prismaClient.delete({
            where: {
                id: tagId,
                userId,
            },
        });
    }

    private async validateMaxTagsForUser(userId: string) {
        const maxTagsCount = 5
        const tagsCount = await this.prismaClient.count({
            where: {
                userId
            }
        })
        if (tagsCount >= maxTagsCount) throw new ErrorApp('validation', `Max tags for one user - ${maxTagsCount}`)
        return true
    }

    private async removeTagFromCameras(tagId: string) {
        const camerasWithTag = await prisma.camera.findMany({
            where: {
                tagIds: {
                    has: tagId
                }
            }
        })

        const updateCameras = camerasWithTag.map((camera) => {
            const updatedTagIds = camera.tagIds.filter((id) => id !== tagId)
            return {
                ...camera,
                tagIds: updatedTagIds
            }
        })

        updateCameras.map(async camera => {
            await prisma.camera.update({
                where: { id: camera.id },
                data: { tagIds: camera.tagIds }
            })
        })
    }
}

export default TagService