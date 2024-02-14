import { FastifyInstance } from "fastify";
import { $ref } from "./camera.schema";
import { createCameraHandler, deleteCameraHandler, getCameraHandler, getCamerasHandler, putCameraHandler } from "./camera.controller";

async function cameraRoutes(server: FastifyInstance) {
    server.post('/', {
        schema:{
            body: $ref('createCameraSchema'),
            response: {
                201: $ref("responseCameraSchema")
            }
        }
    }, createCameraHandler)

    server.get('/', {
        schema:{
            response: {
                200: $ref("getCamerasSchema")
            }
        }
    }, getCamerasHandler)

    server.get('/:id', {
        schema:{
            response: {
                200: $ref("responseCameraSchema")
            }
        }
    }, getCameraHandler)
    
    server.put('/', {
        schema:{
            body: $ref('updateCameraSchema'),
            response: {
                201: $ref("responseCameraSchema")
            }
        }
    }, putCameraHandler)
    
    server.delete('/:id', {
        schema:{
            response: {
                200: $ref("responseCameraSchema")
            }
        }
    }, deleteCameraHandler)
}

export default cameraRoutes