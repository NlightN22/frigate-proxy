import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";
import { configService } from "../shared.service";
import { AppSetting } from "../config/config.settings";

const getAdminRole = async () => {
    try {
        return (await configService.getEncryptedConfig(AppSetting.adminRole.key)).value
    } catch {
        return undefined
    }
}

export async function validateRole(request: FastifyRequest, reply: FastifyReply, allowedRoles: string[]) {
    const adminRole = await getAdminRole()
    if (!adminRole) {
        logger.warn('Admin role not set at config. Pass')
        return
    }
    if (!request.user) throw Error('User not provided to request')
    if (!request.user.roles) throw Error('Roles not provided to request')
    const roles = request.user.roles
    const allowedRole = allowedRoles.some((role) => roles.includes(role))
    if (!allowedRole) reply.code(403).send({ error: 'Forbidden' })
    logger.debug(`allowedRole ${allowedRole}`)
}