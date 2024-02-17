import { FastifyInstance } from "fastify";
import { $ref } from "./camera.schema";
import CameraController from "./camera.controller";

export async function cameraRoutes (server: FastifyInstance) {

    const controller = new CameraController()

    server.post('/', {
        schema:{
            body: $ref('createCameraSchema'),
            response: {
                201: $ref("responseCameraSchema")
            }
        }
    }, controller.createCameraHandler)

    server.get('/', {
        schema:{
            response: {
                200: $ref("responseCamerasSchema")
            }
        }
    }, controller.getCamerasHandler)

    server.get('/:id', {
        schema:{
            response: {
                200: $ref("responseCameraSchema")
            }
        }
    }, controller.getCameraHandler)
    
    server.put('/', {
        schema:{
            body: $ref('updateCameraSchema'),
            response: {
                201: $ref("responseCameraSchema")
            }
        }
    }, controller.putCameraHandler)
    
    server.delete('/:id', {
        schema:{
            response: {
                200: $ref("responseCameraSchema")
            }
        }
    }, controller.deleteCameraHandler)
}
