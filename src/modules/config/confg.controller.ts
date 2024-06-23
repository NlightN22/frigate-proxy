import { FastifyReply, FastifyRequest } from "fastify";
import { withErrorHandler } from "../hooks/error.handler";
import { PutConfigSchema, PutConfigsSchema, putConfigSchema, putConfigsSchema } from "./config.shema";
import ConfigService from "./config.service";
import { z } from "zod";

const configService = ConfigService.getInstance()

export const putConfigController = withErrorHandler(async (req: FastifyRequest<{
    Params: { key: string }
    Body: PutConfigSchema
}>, rep: FastifyReply) => {
    const key = z.string().parse(req.params.key)
    const { value } = putConfigSchema.parse(req.body)
    return rep.send(await configService.saveConfig(key, value))
})

export const putConfigsController = withErrorHandler(async (req: FastifyRequest<{
    Body: PutConfigsSchema
}>, rep: FastifyReply) => {
    const parsed = putConfigsSchema.parse(req.body)
    return rep.send(await configService.saveConfigs(parsed))
})

export const getConfigsController = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    return rep.send(await configService.getAllEncryptedConfig())
})
export const getAdminController = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    return rep.send(await configService.getAdminRole())
})

export const getConfigController = withErrorHandler(async (req: FastifyRequest<{
    Params: { key: string }
}>, rep: FastifyReply) => {
    return rep.send(await configService.getEncryptedConfig(req.params.key))
})

