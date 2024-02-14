import { User } from "../src/modules/users/users.schema";
import fastify from 'fastify'

declare module 'fastify' {
    export interface FastifyRequest {
        user?: User
    }
}

