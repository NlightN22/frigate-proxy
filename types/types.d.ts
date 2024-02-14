import { User } from "../src/modules/users/users.schema";

declare module 'fastify' {
    export interface FastifyRequest {
        user?: User
    }
}

