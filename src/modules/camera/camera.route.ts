import { FastifyInstance } from "fastify";
import {
    $ref, cameraSchemas, deleteByTagIdSchema,
    getByCameraIdSchema, getByHostIdSchema, getCamerasByHosQuerySchema,
    getCamerasQuerySchema, putByTagIdSchema
} from "./camera.schema";
import CameraController from "./camera.controller";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { logRequest, logResponse } from "../hooks/log.hooks";
import { validateAdminRole } from "../hooks/validate.admin.role";

export async function cameraRoutes(server: FastifyInstance) {
    for (const schema of [
        ...cameraSchemas,
    ]) {
        server.addSchema(schema)
    }

    const controller = new CameraController()

    server.addHook('onRequest', logRequest);
    server.addHook('onResponse', logResponse);

    // Routes for unauthenticated users
    server.get('/:id/state', {
        schema: {
            params: getByCameraIdSchema,
            response: {
                200: $ref("responseCameraStateSchema")
            }
        }
    }, controller.getCameraHandler)

    // Routes for authenticated users
    server.register(async function (userRoutes) {
        userRoutes.decorateRequest('user')
        userRoutes.addHook('preValidation', async (request, reply) => {
            await validateJwt(request, reply);
        })



        userRoutes.get('/', {
            schema: {
                querystring: getCamerasQuerySchema,
                response: {
                    200: $ref("responseCamerasSchema")
                }
            }
        }, controller.getCamerasHandler)

        userRoutes.get('/host/:id', {
            schema: {
                params: getByHostIdSchema,
                querystring: getCamerasByHosQuerySchema,
                response: {
                    200: $ref("responseCamerasSchema")
                }
            }
        }, controller.getCamerasByHostHandler)

        userRoutes.get('/:id', {
            schema: {
                params: getByCameraIdSchema,
                response: {
                    200: $ref("responseCameraSchema")
                }
            }
        }, controller.getCameraHandler)

        userRoutes.put('/:id/tag/:tagId', {
            schema: {
                params: putByTagIdSchema,
            }
        }, controller.putTagCameraHandler)

        userRoutes.delete('/:id/tag/:tagId', {
            schema: {
                params: deleteByTagIdSchema,
            }
        }, controller.deleteTagCameraHandler)
    })

    server.register(async function (adminRoutes) {
        adminRoutes.decorateRequest('user')
        adminRoutes.addHook('preValidation', async (request, reply) => {
            await validateJwt(request, reply);
            await validateAdminRole(request, reply);
        })

        adminRoutes.post('/', {
            schema: {
                body: $ref('createCameraSchema'),
                response: {
                    201: $ref("responseCameraSchema")
                }
            }
        }, controller.createCameraHandler)

        adminRoutes.put('/', {
            schema: {
                body: $ref('updateCameraSchema'),
                response: {
                    201: $ref("responseCameraSchema")
                }
            }
        }, controller.putCameraHandler)

        adminRoutes.delete('/:id', {
            schema: {
                params: getByCameraIdSchema,
                response: {
                    200: $ref("responseCameraSchema")
                }
            }
        }, controller.deleteCameraHandler)
    })
}
