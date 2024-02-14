import { FastifyReply, FastifyRequest } from "fastify"
import { withErrorHandler } from "../hooks/error.handler"
import { RolesService } from "./roles.service"

const rolesService = new RolesService()

export const getRolesHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    rep.send(await rolesService.getRoles())
})

export const getRoleHandler = withErrorHandler(async (req: FastifyRequest<{
    Params: { id: string }
}>, rep: FastifyReply) => {
    const { id } = req.params
    rep.send(await rolesService.getRoleOrError(id))
})
