import { FastifyInstance, FastifyRequest } from 'fastify';
import { logRequest, logResponse } from '../hooks/log.hooks';
import { proxyWsParamsSchema } from './proxy.ws.schema';
import { proxyWsService } from './proxy.ws.service';

export async function proxyWsRoute(server: FastifyInstance) {

    server.addHook('onRequest', logRequest)
    server.addHook('onResponse', logResponse)

    // TODO add validation

    server.get('/:hostName/*', {
        schema: {
            params: proxyWsParamsSchema,
        },
        websocket: true,
    }, (connection, req) => {
        proxyWsService({ socket: connection }, 
            req as FastifyRequest<{ Params: { hostName: string } }>)
    })

}