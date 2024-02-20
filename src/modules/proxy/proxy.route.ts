import { FastifyInstance } from "fastify";
import { proxyService } from "./proxy.service";
import { $ref, proxyQueryJsonSchema } from "./proxy.schema";
import { httpProxyService } from "./http.proxy.service";

export async function proxyRoute(fastify: FastifyInstance) {
    fastify.all('/*', {
        schema: {
            params: proxyQueryJsonSchema,
        }
    }, httpProxyService)
}