import { FastifyInstance } from 'fastify';
import { proxyWsService } from './proxy.ws.service';
import { proxyWsParamsSchema } from './proxy.ws.schema';

export async function proxyWsRoute(fastify: FastifyInstance) {
    fastify.get('/:hostName/*', {
        schema: {
            params: proxyWsParamsSchema,
        },
        websocket: true,
     }, proxyWsService);
}