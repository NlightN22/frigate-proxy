import { FastifyReply, FastifyRequest } from "fastify"
import { withErrorHandler } from "../hooks/error.handler"
import { RolesService } from "./roles.service"
import { AddRoleCamerasSchema, DeleteRoleCamerasSchema } from "./roles.schema"

const rolesService = new RolesService()

export const getRolesHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    rep.send(await rolesService.getAllRoles())
})

export const getRoleHandler = withErrorHandler(async (req: FastifyRequest<{
    Params: { id: string }
}>, rep: FastifyReply) => {
    const { id } = req.params
    rep.send(await rolesService.getRoleOrError(id))
})

export const updateRoleCamerasHandler = withErrorHandler(async (req: FastifyRequest<{
    Params: { id: string }
    Body: AddRoleCamerasSchema
}>, rep: FastifyReply) => {
    const { id } = req.params
    const { cameraIDs } = req.body
    rep.send(await rolesService.addCameras(id, cameraIDs))
})
export const deleteRoleCamerasHandler = withErrorHandler(async (req: FastifyRequest<{
    Params: { id: string }
    Body: DeleteRoleCamerasSchema
}>, rep: FastifyReply) => {
    const { id } = req.params
    const { cameraIDs } = req.body
    rep.send(await rolesService.deleteCameras(id, cameraIDs))
})
