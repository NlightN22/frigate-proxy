import { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"
import { ErrorApp, withErrorHandler } from "../hooks/error.handler"
import { PutTagSchema, putTagSchema } from "./tag.schema"
import TagService from "./tag.service"

class TagController {
    private tagsService = new TagService()

    updateTagCamerasHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: PutTagSchema
    }>, rep: FastifyReply) => {
        if (!req.user) throw new ErrorApp('internal', 'User id does not exist')
        const parsedTag = putTagSchema.parse(req.body)
        const maxTagLength = 10
        if (parsedTag.value.length < 1 || parsedTag.value.length > maxTagLength) {
            throw new ErrorApp('validation', `Tag name cannot be empty or bigger than ${maxTagLength} symbols`)
        }
        rep.send(await this.tagsService.upsertTag(parsedTag, req.user.id))
    })

    getTagsCamerasHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
        if (!req.user) throw new ErrorApp('internal', 'User id does not exist')
        rep.send(await this.tagsService.getAllTags(req.user.id))
    })

    getTagCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const parsedId = z.string().parse(id)
        if (!req.user) throw new ErrorApp('internal', 'User id does not exist')
        rep.send(await this.tagsService.getTag(parsedId, req.user.id))
    })

    deleteTagCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const parsedId = z.string().parse(id)
        if (!req.user) throw new ErrorApp('internal', 'User id does not exist')
        rep.send(await this.tagsService.deleteTag(parsedId, req.user.id))
    })
}

export default TagController