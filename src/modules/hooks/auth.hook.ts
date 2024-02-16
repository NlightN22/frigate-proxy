import { FastifyInstance } from "fastify";
import { validateJwt } from "./jwks-rsa.prehandler";
import { validateRole } from "./roles.prehandler";
import { predefinedRoles } from "../../consts";
import { configService } from "../shared.service";
import { AppSetting } from "../config/config.settings";
import { logger } from "../../utils/logger";

export const adminOnlyHook = async (server: FastifyInstance) => {
    let adminRole
    try {
        adminRole = (await configService.getEncryptedConfig(AppSetting.adminRole.key)).value
    } catch (e) {
        if (e instanceof Error) {
            logger.error(`adminOnlyHook ${e.message}`)
        }
    }
    if (!adminRole) {
        logger.warn(`adminRole does not exist at config`)
    }
    const allowedRoles = [
        adminRole
    ]
    server.decorateRequest('user')
    server.addHook('preHandler', async (request, reply) => {
        await validateJwt(request, reply);
        await validateRole(request, reply, allowedRoles);
    })
}