import { FastifyInstance } from "fastify"
import { deleteRoleCamerasHandler, getRoleHandler, getRolesHandler, updateRoleCamerasHandler } from "./roles.controller"
import { $ref, getRoleByIdSchema } from "./roles.schema"

export async function rolesRoutes(server: FastifyInstance) {
    server.put('/:id/cameras', {
        schema:{
            params: getRoleByIdSchema,
            body: $ref('addRoleCamerasSchema'),
            response: {
                // 201: $ref("responseRoleSchema")
            }
        }
    }, updateRoleCamerasHandler)
    server.delete('/:id/cameras', {
        schema:{
            params: getRoleByIdSchema,
            body: $ref('deleteRoleCamerasSchema'),
            response: {
                // 201: $ref("responseRoleSchema")
            }
        }
    }, deleteRoleCamerasHandler)
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
                200: $ref('responseRolesAndCamerasSchema')
            }
        }
    }, getRoleHandler)

}

