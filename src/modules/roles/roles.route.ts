import { FastifyInstance } from "fastify"
import { getRoleHandler, getRolesHandler } from "./roles.controller"
import { $ref, getRoleByIdSchema } from "./roles.schema"

export async function rolesRoutes(server: FastifyInstance) {
    server.get('/', {
        schema: {
            response: {
                200: $ref('responseRolesSchema')
            }
        }
    }, getRolesHandler)
    server.get('/:id', {
        schema: {
            params: getRoleByIdSchema,
            response: {
                200: $ref('responseRoleSchema')
            }
        }
    }, getRoleHandler)
}

