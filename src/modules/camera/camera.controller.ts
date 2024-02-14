import { FastifyReply, FastifyRequest } from "fastify";
import { withErrorHandler } from "../hooks/error.handler";
import { CreateCameraSchema, ResponseCameraSchema, UpdateCameraSchema, createCameraSchema, updateCameraSchema } from "./camera.schema";
import { createCamera, deleteCamera, editCamera, getCamera, getCameras } from "./camera.service";

export const createCameraHandler = withErrorHandler(async (req: FastifyRequest<{
    Body: CreateCameraSchema
}>, rep: FastifyReply) => {
    const parsed = createCameraSchema.parse(req.body);
    const frigateHost = await createCamera(parsed);
    rep.code(201).send(frigateHost);
})

export const putCameraHandler = withErrorHandler(async (req: FastifyRequest<{
    Body: UpdateCameraSchema
}>, rep: FastifyReply) => {
    const data = updateCameraSchema.parse(req.body)
    const frigateHost = await editCamera(data)
    rep.code(201).send(frigateHost)
})

export const getCamerasHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    const servers = await getCameras()
    rep.send(servers)
})

export const getCameraHandler = withErrorHandler(async (req: FastifyRequest<{
    Params: { id: string }
}>, rep: FastifyReply) => {
    const { id } = req.params
    const frigateHost = await getCamera(id)
    rep.send(frigateHost)
})

export const deleteCameraHandler = withErrorHandler(async (req: FastifyRequest<{
    Params: { id: string }
}>, rep: FastifyReply) => {
    const { id } = req.params
    if (!id) throw Error('deleteCameraHandler need camera id')
    rep.send(await deleteCamera(id))
})