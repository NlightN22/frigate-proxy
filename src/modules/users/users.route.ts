import { FastifyInstance } from "fastify";
import { getUsersByRoleSchema } from "./users.schema";
import UsersController from "./users.controller";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { logRequest, logResponse } from "../hooks/log.hooks";

export async function usersRoutes(server: FastifyInstance) {
    const usersController = new UsersController()

    server.addHook('onRequest', logRequest)
    server.addHook('onResponse', logResponse)

    server.decorateRequest('user')
    server.addHook('preValidation', async (request, reply) => {
        await validateJwt(request, reply)
    })

    server.get('/', {

    }, usersController.getUsersHandler)

    server.get('/:role', {
        schema: {
            params: getUsersByRoleSchema,
        }
    }, usersController.getUsersByRoleHandler)
}