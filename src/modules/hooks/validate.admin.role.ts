import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";
import ConfigService from "../config/config.service";
import ConfigOIDPService from "../config/oidp/config.oidp.service";
import { ErrorApp } from "./error.handler";

export async function validateAdminRole(request: FastifyRequest, reply: FastifyReply) {
        const configService = ConfigService.getInstance()
        const configOIDPService = ConfigOIDPService.getInstance()

        const oidpConfig = await configOIDPService.getDecryptedOIDPConfig()
        if (!oidpConfig) {
            logger.warn('OpenID provider not set at config. Pass')
            return
        }
        const adminRole = await configService.getAdminRole()
        if (!adminRole) {
            logger.warn('Admin role not set at config. Pass')
            return
        }
        if (!request.user) throw new ErrorApp('authorization', 'User not provided to request')
        if (!request.user.roles) throw new ErrorApp('authorization', 'Roles not provided to request')
        const roles = request.user.roles
        if (roles.includes(adminRole.value)) {
            logger.debug(`Admin role. Pass`)
            return
        }
        reply.code(403).send({ error: 'Forbidden' })
        logger.debug(`not admin role: ${adminRole}`)
}