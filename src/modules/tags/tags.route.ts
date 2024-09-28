import { FastifyInstance } from "fastify"
import { $ref } from "./tags.schema"
import { validateJwt } from "../hooks/jwks-rsa.prehandler"
import { logRequest, logResponse } from "../hooks/log.hooks"
import TagsController from "./tags.controller"

export async function tagsRoutes(server: FastifyInstance) {
    const controller = new TagsController()

    server.addHook('onRequest', logRequest);
    server.addHook('onResponse', logResponse);

    server.decorateRequest('user')
    server.addHook('preValidation', async (request, reply) => {
        await validateJwt(request, reply);
    })

    server.put('/:tagName', {
        schema:{
            body: $ref('addTagCamerasSchema'),
            response: {
                // 201: $ref("responseTagCamerasSchema") // TODO uncomment
            }
        }
    }, controller.putTagCamerasHandler)

    // server.put('/',controller.updateRolesHandler)

    // server.get('/', {
    //     schema: {
    //         response: {
    //             200: $ref('responseRolesSchema')
    //         }
    //     }
    // }, controller.getRolesHandler)

    // server.get('/:id', {
    //     schema: {
    //         params: getRoleByIdSchema,
    //         response: {
    //             200: $ref('responseRolesAndCamerasSchema')
    //         }
    //     }
    // }, controller.getRoleHandler)

    // server.delete('/:id/cameras', {
    //     schema:{
    //         params: getRoleByIdSchema,
    //         body: $ref('deleteRoleCamerasSchema'),
    //         response: {
    //             // 201: $ref("responseRoleSchema")
    //         }
    //     },
    //     preValidation: async (request, reply) => {
    //         const allowedRoles = ['admin']
    //         await validateRole(request, reply, allowedRoles);
    //     }
    // }, controller.deleteRoleCamerasHandler)
}

