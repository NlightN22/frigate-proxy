import { FastifyInstance } from 'fastify';
import { proxyWsService } from './proxy.ws.service';
import { proxyWsParamsSchema } from './proxy.ws.schema';
import { validateJwt } from '../hooks/jwks-rsa.prehandler';
import { logRequest, logResponse } from '../hooks/log.hooks';

export async function proxyWsRoute(server: FastifyInstance) {

    server.addHook('onRequest', logRequest)
    server.addHook('onResponse', logResponse)

    // TODO add validation

    server.get('/:hostName/*', {
        schema: {
            params: proxyWsParamsSchema,
        },
        websocket: true,
     }, proxyWsService);
}