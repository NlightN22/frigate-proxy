import { FastifyInstance } from "fastify";
import { UserService } from "./users.service";
import { logger } from "../../utils/logger";
import { usersByRoleQueryJsonSchema } from "./users.schema";
import { validateToken } from "../hooks/openid.prehandler";

export async function usersRoutes(fastify: FastifyInstance) {
    const userService = new UserService
    fastify.get('/', {
        preHandler: validateToken,
    },
        async () => await userService.getUsers())

    fastify.get('/byrole', {
        preHandler: validateToken,
        schema: {
            querystring: usersByRoleQueryJsonSchema,
        }
    },
        async (request, reply) => {
            try {
                const { method, body, query, params } = request;
                const { roleName } = query as any
                if (roleName) return await userService.getUsersByRole(roleName)
            } catch (e) {
                logger.error(e)
            }
        })
}