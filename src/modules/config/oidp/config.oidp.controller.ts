import { FastifyRequest, FastifyReply } from "fastify";
import { withErrorHandler } from "../../hooks/error.handler";
import ConfigOIDPService from "./config.oidp.service"
import * as schemas from "./config.oidp.schema"

class ConfigOIDPController {
    configOIDPService = ConfigOIDPService.getInstance()

    putOIDPConfigHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: schemas.PutOIDPConfig
    }>, rep: FastifyReply) => {
        const parsed = schemas.oIDPConfigSchema.parse(req.body)
        const result = await this.configOIDPService.saveOIDPconfig(parsed)
        rep.send(result)
    });

    putTestOIDPConfigHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: schemas.PutOIDPConfig
    }>, rep: FastifyReply) => {
        const parsed = schemas.oIDPConfigSchema.parse(req.body)
        const result = await this.configOIDPService.testOIDPconfig(parsed)
        rep.send(result)
    });

    getConfigsController = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
        return rep.send(await this.configOIDPService.getDecryptedOIDPConfig())
    })
    
}

export default ConfigOIDPController