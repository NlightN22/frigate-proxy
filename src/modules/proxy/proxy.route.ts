import { FastifyInstance } from "fastify";
import { proxyService } from "./proxy.service";
import { $ref, proxyQueryJsonSchema } from "./proxy.schema";

async function proxyRoute(fastify: FastifyInstance) {
    fastify.all('/*', {
        schema: {
            params: proxyQueryJsonSchema,
        }
    }, proxyService)
}

export default proxyRoute