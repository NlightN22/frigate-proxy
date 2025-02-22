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

    getCamerasHandler = withErrorHandler(async (req: FastifyRequest<{
        Querystring: {
            name?: string;
            frigateHostId?: string;
            tagIds?: string[];
            offset?: number;
            limit?: number;
        }
    }>, rep: FastifyReply) => {
        const { name, frigateHostId, tagIds, offset, limit } = req.query;

        const roles = req.user?.roles || []
        const cameras = await this.cameraService.getAllCameras(roles, name, frigateHostId, tagIds, offset, limit)
        rep.send(cameras)
    })

    getCamerasByHostHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string },
        Querystring: {
            offset?: number;
            limit?: number;
        }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const { offset, limit } = req.query;
        const pasedId = z.string().parse(id)
        const roles = req.user?.roles || []
        const cameras = await this.cameraService.getAllCameras(roles, '', pasedId, [], offset, limit)
        rep.send(cameras)
    })

    getCameraHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const parsedId = z.string().parse(id)
        const camera = await this.cameraService.getCamera(parsedId)
        rep.send(camera)
    })

    getCameraStateHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const parsedId = z.string().parse(id)
        const camera = await this.cameraService.getCameraState(parsedId)
        rep.send(camera)
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