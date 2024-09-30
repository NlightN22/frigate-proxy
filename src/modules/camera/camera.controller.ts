import { FastifyReply, FastifyRequest } from "fastify";
import { withErrorHandler } from "../hooks/error.handler";
import { CreateCameraSchema, ResponseCameraSchema, UpdateCameraSchema, createCameraSchema, updateCameraSchema } from "./camera.schema";
import CameraService from "./camera.service";
import { z } from "zod";


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

    putTagCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: {
            id: string,
            tagId: string,
        }
    }>, rep: FastifyReply) => {
        const { id, tagId } = req.params
        const parsedId = z.string().parse(id)
        const parsedTagId = z.string().parse(tagId)
        return rep.code(201).send(await this.cameraService.addTagToCamera(parsedId, parsedTagId))
    })

    getCamerasHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
        const roles = req.user?.roles || []
        const servers = await this.cameraService.getAllCameras(roles)
        rep.send(servers)
    })

    getCamerasByHostHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const pasedId = z.string().parse(id)
        const roles = req.user?.roles || []
        const servers = await this.cameraService.getAllCamerasByHost(roles, pasedId)
        rep.send(servers)
    })

    getCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const parsedId = z.string().parse(id)
        const frigateHost = await this.cameraService.getCamera(parsedId)
        rep.send(frigateHost)
    })

    getCameraStateHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const parsedId = z.string().parse(id)
        const frigateHost = await this.cameraService.getCamerState(parsedId)
        rep.send(frigateHost)
    })

    deleteCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const parsedId = z.string().parse(id)
        rep.send(await this.cameraService.deleteCamera(parsedId))
    })

    deleteTagCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: {
            id: string,
            tagId: string,
        },
    }>, rep: FastifyReply) => {
        const { id, tagId } = req.params
        const parsedId = z.string().parse(id)
        const parsedTagId = z.string().parse(tagId)
        return rep.send(await this.cameraService.deleteTagFromCamera(parsedId, parsedTagId))
    })


}
export default CameraController