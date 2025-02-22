import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";
import ConfigService from "../config/config.service";
import ConfigOIDPService from "../config/oidp/config.oidp.service";
import { ErrorApp } from "./error.handler";

export async function validateRole(request: FastifyRequest, reply: FastifyReply, allowedRoles: string[]) {
    const configService = ConfigService.getInstance()
    const configOIDPService = ConfigOIDPService.getInstance()

    if (!allowedRoles || allowedRoles.length<1){
        logger.warn('Not set allowed roles to route. Pass')
        return
    }
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
    if (!request.user) throw new ErrorApp('authorization','User not provided to request')
    if (!request.user.roles) throw new ErrorApp('authorization','Roles not provided to request')
    const roles = request.user.roles
    if (roles.includes(adminRole.value)) {
        logger.debug(`Admin role. Pass`)
        return
    }
    const allowedRole = allowedRoles.some((role) => roles.includes(role))
    if (!allowedRole) reply.code(403).send({ error: 'Forbidden' })
    logger.debug(`allowedRole ${allowedRole}`)
}

export async function isAdminRolePrehandler(request: FastifyRequest, reply: FastifyReply) {
    const allowedRoles = ['admin',]
    await validateRole(request, reply, allowedRoles)
}