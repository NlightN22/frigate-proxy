import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";
import { AppSetting, appSettingsKeys } from "../config/app.settings";
import { ErrorApp } from "./error.handler";
import ConfigService from "../config/config.service";

const getAdminRole = async () => {
    try {
        const configService = new ConfigService()
        return (await configService.getEncryptedConfig(appSettingsKeys.adminRole)).value
    } catch {
        return undefined
    }
}

export async function validateRole(request: FastifyRequest, reply: FastifyReply, allowedRoles: string[]) {
    if (!allowedRoles || allowedRoles.length<1){
        logger.warn('Not set allowed roles to route. Pass')
        return
    }
    const adminRole = await getAdminRole()
    if (!adminRole) {
        logger.warn('Admin role not set at config. Pass')
        return
    }
    if (!request.user) throw new ErrorApp('authorization','User not provided to request')
    if (!request.user.roles) throw new ErrorApp('authorization','Roles not provided to request')
    const roles = request.user.roles
    if (roles.includes(adminRole)) {
        logger.debug(`Admin role. Pass`)
        return
    }
    const allowedRole = allowedRoles.some((role) => roles.includes(role))
    if (!allowedRole) reply.code(403).send({ error: 'Forbidden' })
    logger.debug(`allowedRole ${allowedRole}`)
}