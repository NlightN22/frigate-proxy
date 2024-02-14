import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";

export async function validateRole(request: FastifyRequest, reply: FastifyReply, allowedRoles: string[]) {
    if (!request.user) throw Error('User not provided to request')
    if (!request.user.roles) throw Error('Roles not provided to request')
    const roles = request.user.roles
    const allowedRole = allowedRoles.some( (role) => roles.includes(role))
    if (!allowedRole) reply.code(403).send({error: 'Forbidden'})
    logger.debug(`allowedRole ${allowedRole}`)
}