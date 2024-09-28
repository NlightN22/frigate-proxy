import { FastifyReply, FastifyRequest } from "fastify"
import { ErrorApp, withErrorHandler } from "../hooks/error.handler"
import { z } from "zod"
import TagService from "./tag.service"
import { PutTagCameraSchema, putTagCamerasSchema } from "./tag.schema"


class TagController {
    tagsService = new TagService()

    updateTagCamerasHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: PutTagCameraSchema
    }>, rep: FastifyReply) => {
        if (!req.user) throw new ErrorApp('internal', 'User id does not exist')
        const parsedTag = putTagCamerasSchema.parse(req.body)
        if (parsedTag.value.length < 1 || parsedTag.value.length > 5) throw new ErrorApp('validation', 'Tag name can not be empty or bigger than 5 symbols')
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