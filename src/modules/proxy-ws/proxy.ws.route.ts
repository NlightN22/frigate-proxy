import { FastifyInstance } from 'fastify';
import { proxyWsService } from './proxy.ws.service';
import { proxyWsParamsSchema } from './proxy.ws.schema';
import { validateJwt } from '../hooks/jwks-rsa.prehandler';

export async function proxyWsRoute(server: FastifyInstance) {

    // TODO add validation

    server.get('/:hostName/*', {
        schema: {
            params: proxyWsParamsSchema,
        },
        websocket: true,
     }, proxyWsService);
}