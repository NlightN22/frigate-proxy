import { FastifyInstance } from "fastify"
import { $ref, getRoleByIdSchema } from "./roles.schema"
import RolesController from "./roles.controller"

export async function rolesRoutes(server: FastifyInstance) {
    const controller = new RolesController()
    server.put('/:id/cameras', {
        schema:{
            params: getRoleByIdSchema,
            body: $ref('addRoleCamerasSchema'),
            response: {
                // 201: $ref("responseRoleSchema")
            }
        }
    }, controller.updateRoleCamerasHandler)
    server.delete('/:id/cameras', {
        schema:{
            params: getRoleByIdSchema,
            body: $ref('deleteRoleCamerasSchema'),
            response: {
                // 201: $ref("responseRoleSchema")
            }
        }
    }, controller.deleteRoleCamerasHandler)
    server.get('/', {
        schema: {
            response: {
                200: $ref('responseRolesSchema')
            }
        }
    }, controller.getRolesHandler)
    server.get('/:id', {
        schema: {
            params: getRoleByIdSchema,
            response: {
                200: $ref('responseRolesAndCamerasSchema')
            }
        }
    }, controller.getRoleHandler)

}

