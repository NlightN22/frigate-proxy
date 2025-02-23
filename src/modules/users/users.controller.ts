import { FastifyReply, FastifyRequest } from "fastify";
import { withErrorHandler } from "../hooks/error.handler";
import UserService from "./users.service";
import { z } from "zod";


class UsersController {

    private userService = UserService.getInstance()

    getUsersHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
        const users = await this.userService.getUsers()
        rep.send(users)
    })

    getUsersByRoleHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { role: string }
    }>, rep: FastifyReply) => {
        const { role } = req.params;
        const parsed = z.string().parse(role)
        const users = await this.userService.getUsersByRole(parsed)
        rep.send(users)
    })
}

export default UsersController