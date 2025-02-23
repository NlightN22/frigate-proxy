import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function testRoutes(server: FastifyInstance) {
    server.get('/test', async (request: FastifyRequest, reply: FastifyReply) => {
        return { message: 'Test route works' }
    })
}