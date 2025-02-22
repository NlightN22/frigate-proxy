import { FastifyInstance } from "fastify";
import { getConfigsController, getConfigController, putConfigController, putConfigsController, getAdminController } from "./confg.controller";
import { $ref, paramConfigSchema } from "./config.schema";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { validateAdminRole } from "../hooks/validate.admin.role";
import { logRequest, logResponse } from "../hooks/log.hooks";
import { configOIDPRoutes } from "./oidp/config.oidp.route";

export async function configRoutes(server: FastifyInstance) {

    server.addHook('onRequest', logRequest);
    server.addHook('onResponse', logResponse);

    server.get('/admin', {
        schema: {
            response: { 200: $ref('responseConfigSchema')},
        },
    }, getAdminController)

    server.register(async function (adminRoutes) {
        adminRoutes.decorateRequest('user')
        adminRoutes.addHook('preValidation', async (request, reply) => {
            await validateJwt(request, reply);
            await validateAdminRole(request, reply);
        })
    
        adminRoutes.get('/', {
            schema: {
                response: { 200: $ref('responseConfigsSchema')},
            },
        }, getConfigsController)
    
        adminRoutes.get('/:key', {
            schema: {
                params: paramConfigSchema,
                response:{ 200: $ref('responseConfigSchema')}
            }
        }, getConfigController)
        adminRoutes.put('/:key', {
            schema: {
                params: paramConfigSchema,
                response:{ 200: $ref('responseConfigSchema')}
            }
        }, putConfigController)
        adminRoutes.put('/', {
            schema: {
                body: $ref('putConfigsSchema'),
                response: {
                    201: $ref('responseConfigsSchema'),
                }
            }
        }, putConfigsController)

        adminRoutes.register(async function (oidpRoutes) {
            await oidpRoutes.register(configOIDPRoutes, { prefix: '/oidp' })
        })
    })
}