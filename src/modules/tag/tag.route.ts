import { FastifyInstance } from "fastify"
import { $ref, getTagByIdSchema } from "./tag.schema"
import { validateJwt } from "../hooks/jwks-rsa.prehandler"
import { logRequest, logResponse } from "../hooks/log.hooks"
import TagController from "./tag.controller"

export async function tagsRoutes(server: FastifyInstance) {
    const controller = new TagController()

    server.addHook('onRequest', logRequest);
    server.addHook('onResponse', logResponse);

    server.decorateRequest('user')
    server.addHook('preValidation', async (request, reply) => {
        await validateJwt(request, reply);
    })

    server.put('/', {
        schema: {
            body: $ref('putTagCamerasSchema'),
            response: {
                // 201: $ref("responseTagCamerasSchema") // TODO uncomment
            }
        }
    }, controller.updateTagCamerasHandler)

    server.get('/', {
        schema: {
            response: {
                200: $ref('responseTagsCamerasSchema')
            }
        }
    }, controller.getTagsCamerasHandler)

    server.get('/:id', {
        schema: {
            params: getTagByIdSchema,
            response: {
                // 200: $ref('responseTagCamerasSchema')
            }
        }
    }, controller.getTagCameraHandler)

    server.delete('/:id', {
        schema: {
            params: getTagByIdSchema,
            response: {
                // 200: $ref('responseTagCamerasSchema')
            }
        }
    }, controller.deleteTagCameraHandler)
}

