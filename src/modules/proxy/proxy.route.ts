import { FastifyInstance } from "fastify";
import { proxyParamschema } from "./proxy.schema";
import { httpProxyService } from "./http.proxy.service";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";

export async function proxyRoute(server: FastifyInstance) {

    server.decorateRequest('user')
    server.addHook('preValidation', async (request, reply) => {
        await validateJwt(request, reply);
    })

    server.all('/:hostName/*', {
        schema: {
            params: proxyParamschema,
        }
    }, httpProxyService)
}