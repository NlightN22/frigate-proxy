import { FastifyReply, FastifyRequest } from "fastify";
import { withErrorHandler } from "../hooks/error.handler";
import { PutConfigSchema, PutConfigsSchema, putConfigSchema, putConfigsSchema } from "./config.schema";
import ConfigService from "./config.service";
import { z } from "zod";

export class ConfigController {
    private configService = ConfigService.getInstance()

    putConfig = withErrorHandler(async (req: FastifyRequest<{
        Params: { key: string }
        Body: PutConfigSchema
    }>, rep: FastifyReply) => {
        const key = z.string().parse(req.params.key)
        const { value } = putConfigSchema.parse(req.body)
        return rep.send(await this.configService.saveConfig(key, value))
    })
    
    putConfigs = withErrorHandler(async (req: FastifyRequest<{
        Body: PutConfigsSchema
    }>, rep: FastifyReply) => {
        const parsed = putConfigsSchema.parse(req.body)
        return rep.send(await this.configService.saveConfigs(parsed))
    })
    
    getConfigs = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
        return rep.send(await this.configService.getAllEncryptedConfig())
    })
    getAdminController = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
        return rep.send(await this.configService.getAdminRole())
    })
    
    getConfig = withErrorHandler(async (req: FastifyRequest<{
        Params: { key: string }
    }>, rep: FastifyReply) => {
        return rep.send(await this.configService.getEncryptedConfig(req.params.key))
    })

}



