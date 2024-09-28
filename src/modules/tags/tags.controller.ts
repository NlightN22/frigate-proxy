import { FastifyReply, FastifyRequest } from "fastify"
import { ErrorApp, withErrorHandler } from "../hooks/error.handler"
import { z } from "zod"
import TagsService from "./tags.service"


class TagsController {
    tagsService = new TagsService()

    putTagCamerasHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
        rep.send(await this.tagsService)
    })

    // getRolesHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    //     rep.send(await this.rolesService.getAllRoles())
    // })

    // getRoleHandler = withErrorHandler(async (req: FastifyRequest<{
    //     Params: { id: string }
    // }>, rep: FastifyReply) => {
    //     const { id } = req.params
    //     rep.send(await this.rolesService.getRoleOrError(id))
    // })

    // updateRolesHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    //     rep.send(await this.rolesService.updateRoles())
    // })

    // updateRoleCamerasHandler = withErrorHandler(async (req: FastifyRequest<{
    //     Params: { id: string }
    //     Body: AddRoleCamerasSchema
    // }>, rep: FastifyReply) => {
    //     const { id } = req.params
    //     const { cameraIDs } = addRoleCamerasSchema.parse(req.body)
    //     rep.send(await this.rolesService.editCameras(id, cameraIDs))
    // })
    // deleteRoleCamerasHandler = withErrorHandler(async (req: FastifyRequest<{
    //     Params: { id: string }
    //     Body: DeleteRoleCamerasSchema
    // }>, rep: FastifyReply) => {
    //     const { id } = req.params
    //     const { cameraIDs } = deleteRoleCamerasSchema.parse(req.body)
    //     if (cameraIDs.length < 1) throw new ErrorApp('validate', 'Nothing to delete')
    //     rep.send(await this.rolesService.deleteCameras(id, cameraIDs))
    // })
}

export default TagsController