import { FastifyInstance } from "fastify"
import { $ref, getRoleByIdSchema } from "./roles.schema"
import RolesController from "./roles.controller"
import { validateJwt } from "../hooks/jwks-rsa.prehandler"
import { validateAdminRole } from "../hooks/validate.admin.role"
import { logRequest, logResponse } from "../hooks/log.hooks"

export async function rolesRoutes(server: FastifyInstance) {
    const controller = new RolesController()

    server.addHook('onRequest', logRequest);
    server.addHook('onResponse', logResponse);

    server.decorateRequest('user')
    server.addHook('preValidation', async (request, reply) => {
        await validateJwt(request, reply);
    })

    server.put('/:id/cameras', {
        schema:{
            params: getRoleByIdSchema,
            body: $ref('addRoleCamerasSchema'),
        },
        preValidation: async (request, reply) => {
            await validateAdminRole(request, reply);
        }
    }, controller.updateRoleCamerasHandler)

    server.put('/',controller.updateRolesHandler)

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

    server.delete('/:id/cameras', {
        schema:{
            params: getRoleByIdSchema,
            body: $ref('deleteRoleCamerasSchema'),
        },
        preValidation: async (request, reply) => {
            await validateAdminRole(request, reply);
        }
    }, controller.deleteRoleCamerasHandler)
}

