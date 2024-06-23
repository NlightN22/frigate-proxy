import { FastifyInstance } from "fastify";
import { proxyParamschema } from "./proxy.schema";
import { allowedNotUserRoutes, getRequestPath, httpProxyService } from "./http.proxy.service";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { logRequest, logResponse } from "../hooks/log.hooks";

export async function proxyRoute(server: FastifyInstance) {

    server.addHook('onRequest', logRequest)
    server.addHook('onResponse', logResponse)

    server.decorateRequest('user')
    server.addHook('preValidation', async (request, reply) => {
        const requestPath = getRequestPath(request)
        const isAllowedRoute = allowedNotUserRoutes.some(pattern => pattern.test(requestPath))
        if (!isAllowedRoute) await validateJwt(request, reply);
    })

    server.all('/:hostName/*', {
        schema: {
            params: proxyParamschema,
        }
    }, httpProxyService)
}