import { FastifyReply, FastifyRequest } from "fastify";
import { withErrorHandler } from "../hooks/error.handler";
import { configService } from "../shared.service";
import { PutConfigSchema, putConfigSchema } from "./config.shema";

export const putConfigController = withErrorHandler(async (req: FastifyRequest<{
    Body: PutConfigSchema
}>, rep: FastifyReply) => {
    const parsedBody = putConfigSchema.parse(req.body)
    return rep.send(await configService.saveConfig(parsedBody))
})

export const getSettingsController = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    return rep.send(await configService.getSettings())
})

export const getConfigsController = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    return rep.send(await configService.getAllConfig())
})

export const getSettingController = withErrorHandler(async (req: FastifyRequest<{
    Params: { key: string }
}>, rep: FastifyReply) => {
    return rep.send(await configService.getConfig(req.params.key))
})

