import { FastifyInstance } from 'fastify';
import { proxyWsService } from './proxy.ws.service';
import { proxyWsQueryJsonSchema } from './proxy.ws.schema';

async function proxyWsRoute(fastify: FastifyInstance) {
    fastify.get('/*', {
        schema: {
            querystring: proxyWsQueryJsonSchema,
        },
        websocket: true,
     }, proxyWsService);
}

export default proxyWsRoute