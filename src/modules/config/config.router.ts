import { FastifyInstance } from "fastify";
import { getConfigsController, getConfigController, putConfigController, putConfigsController, getAdminController } from "./confg.controller";
import { $ref, paramConfigSchema } from "./config.shema";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { validateRole } from "../hooks/roles.prehandler";
import { logRequest, logResponse } from "../hooks/log.hooks";

export async function configRoutes(server: FastifyInstance) {

    server.addHook('onRequest', logRequest);
    server.addHook('onResponse', logResponse);

    server.get('/admin', {
        schema: {
            response: { 200: $ref('responseConfigSchema')},
        },
    }, getAdminController)

    server.register(async function (protectedRoutes) {
        protectedRoutes.decorateRequest('user')
        protectedRoutes.addHook('preValidation', async (request, reply) => {
            await validateJwt(request, reply);
            const allowedRoles = ['admin',]
            await validateRole(request, reply, allowedRoles);
        })
    
        protectedRoutes.get('/', {
            schema: {
                response: { 200: $ref('responseConfigsSchema')},
            },
        }, getConfigsController)
    
        protectedRoutes.get('/:key', {
            schema: {
                params: paramConfigSchema,
                response:{ 200: $ref('responseConfigSchema')}
            }
        }, getConfigController)
        protectedRoutes.put('/:key', {
            schema: {
                params: paramConfigSchema,
                response:{ 200: $ref('responseConfigSchema')}
            }
        }, putConfigController)
        protectedRoutes.put('/', {
            schema: {
                body: $ref('putConfigsSchema'),
                response: {
                    201: $ref('responseConfigsSchema'),
                }
            }
        }, putConfigsController)
    })
}