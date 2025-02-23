import { FastifyInstance } from "fastify";
import { $ref, paramConfigSchema } from "./config.schema";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { validateAdminRole } from "../hooks/validate.admin.role";
import { logRequest, logResponse } from "../hooks/log.hooks";
import { configOIDPRoutes } from "./oidp/config.oidp.route";
import { ConfigController } from "./confg.controller";
import ConfigService from "./config.service";

export async function configRoutes(server: FastifyInstance) {

    const configService = ConfigService.getInstance()
    const controller = new ConfigController(configService)

    server.addHook('onRequest', logRequest);
    server.addHook('onResponse', logResponse);

    server.get('/admin', {
        schema: {
            response: { 200: $ref('responseConfigSchema')},
        },
    }, controller.getAdminController)

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
        }, controller.getConfigs)
    
        adminRoutes.get('/:key', {
            schema: {
                params: paramConfigSchema,
                response:{ 200: $ref('responseConfigSchema')}
            }
        }, controller.getConfig)
        adminRoutes.put('/:key', {
            schema: {
                params: paramConfigSchema,
                response:{ 200: $ref('responseConfigSchema')}
            }
        }, controller.putConfig)
        adminRoutes.put('/', {
            schema: {
                body: $ref('putConfigsSchema'),
                response: {
                    201: $ref('responseConfigsSchema'),
                }
            }
        }, controller.putConfigs)

        adminRoutes.register(async function (oidpRoutes) {
            await oidpRoutes.register(configOIDPRoutes, { prefix: '/oidp' })
        })
    })
}