import { FastifyInstance } from "fastify";
import { UserService } from "./users.service";
import { logger } from "../../utils/logger";
import { getUsersByRoleSchema } from "./users.schema";
import UsersController from "./users.controller";

export async function usersRoutes(fastify: FastifyInstance) {
    const usersController = new UsersController()
    fastify.get('/', {

    }, usersController.getUsersHandler)

    fastify.get('/:role', {
        schema: {
            params: getUsersByRoleSchema,
        }
    }, usersController.getUsersByRoleHandler)
}