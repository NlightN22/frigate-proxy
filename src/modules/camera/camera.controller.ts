import { FastifyReply, FastifyRequest } from "fastify";
import { withErrorHandler } from "../hooks/error.handler";
import { CreateCameraSchema, ResponseCameraSchema, UpdateCameraSchema, createCameraSchema, updateCameraSchema } from "./camera.schema";
import CameraService from "./camera.service";


class CameraController {

    cameraService = new CameraService()

    createCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: CreateCameraSchema
    }>, rep: FastifyReply) => {
        const parsed = createCameraSchema.parse(req.body);
        const frigateHost = await this.cameraService.createCamera(parsed);
        rep.code(201).send(frigateHost);
    })

    putCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: UpdateCameraSchema
    }>, rep: FastifyReply) => {
        const data = updateCameraSchema.parse(req.body)
        const frigateHost = await this.cameraService.editCamera(data)
        rep.code(201).send(frigateHost)
    })

    getCamerasHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
        const servers = await this.cameraService.getAllCameras()
        rep.send(servers)
    })

    getCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const frigateHost = await this.cameraService.getCamera(id)
        rep.send(frigateHost)
    })

    deleteCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        if (!id) throw Error('deleteCameraHandler need camera id')
        rep.send(await this.cameraService.deleteCamera(id))
    })
}
export default CameraController