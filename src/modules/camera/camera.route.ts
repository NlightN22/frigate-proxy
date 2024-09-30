import { FastifyInstance } from "fastify";
import { $ref, deleteByTagIdSchema, getByCameraIdSchema, getByHostIdSchema, putByTagIdSchema } from "./camera.schema";
import CameraController from "./camera.controller";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { logRequest, logResponse } from "../hooks/log.hooks";

export async function cameraRoutes(server: FastifyInstance) {
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
    server.decorateRequest('user')
    server.post('/', {
        preValidation: [validateJwt],
        schema: {
            body: $ref('createCameraSchema'),
            response: {
                201: $ref("responseCameraSchema")
            }
        }
    }, controller.createCameraHandler)

    server.get('/', {
        preValidation: [validateJwt],
        schema: {
            response: {
                200: $ref("responseCamerasSchema")
            }
        }
    }, controller.getCamerasHandler)

    server.get('/host/:id', {
        preValidation: [validateJwt],
        schema: {
            params: getByHostIdSchema,
            response: {
                200: $ref("responseCamerasSchema")
            }
        }
    }, controller.getCamerasByHostHandler)



    server.get('/:id', {
        preValidation: [validateJwt],
        schema: {
            params: getByCameraIdSchema,
            response: {
                200: $ref("responseCameraSchema")
            }
        }
    }, controller.getCameraHandler)

    server.put('/', {
        preValidation: [validateJwt],
        schema: {
            body: $ref('updateCameraSchema'),
            response: {
                201: $ref("responseCameraSchema")
            }
        }
    }, controller.putCameraHandler)

    server.put('/:id/tag/:tagId', {
        preValidation: [validateJwt],
        schema: {
            params: putByTagIdSchema,
            // response: {
            //     200: $ref("responseCameraSchema")
            // }
        }
    }, controller.putTagCameraHandler)

    server.delete('/:id', {
        preValidation: [validateJwt],
        schema: {
            params: getByCameraIdSchema,
            response: {
                200: $ref("responseCameraSchema")
            }
        }
    }, controller.deleteCameraHandler)


    server.delete('/:id/tag/:tagId', {
        preValidation: [validateJwt],
        schema: {
            params: deleteByTagIdSchema,
            // response: {
            //     200: $ref("responseCameraSchema")
            // }
        }
    }, controller.deleteTagCameraHandler)
}
