import { FastifyInstance } from "fastify";
import { getConfigsController, getConfigController, putConfigController, putConfigsController } from "./confg.controller";
import { $ref, paramConfigSchema } from "./config.shema";

export async function configRoutes(server: FastifyInstance) {

    server.get('/', {
        schema: {
            response: { 200: $ref('responseConfigsSchema')},
        }
    }, getConfigsController)
    server.get('/:key', {
        schema: {
            params: paramConfigSchema,
            response:{ 200: $ref('responseConfigSchema')}
        }
    }, getConfigController)
    server.put('/:key', {
        schema: {
            params: paramConfigSchema,
            response:{ 200: $ref('responseConfigSchema')}
        }
    }, putConfigController)
    server.put('/', {
        schema: {
            body: $ref('putConfigsSchema'),
            response: {
                201: $ref('responseConfigsSchema'),
            }
        }
    }, putConfigsController)
}