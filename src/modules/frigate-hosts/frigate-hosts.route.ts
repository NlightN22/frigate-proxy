import { FastifyInstance } from "fastify";
import { logRequest, logResponse } from "../hooks/log.hooks";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { validateAdminRole } from "../hooks/roles.prehandler";
import FrigateHostController from "./frigate-hosts.controller";
import { $ref, getHostByIdSchema, getHostByNameSchema } from "./frigate-hosts.schema";

export async function frigateHostsRoutes(server: FastifyInstance) {

    const controller = new FrigateHostController()

    server.addHook('onRequest', logRequest);
    server.addHook('onResponse', logResponse);

    // Routes for unauthenticated users
    server.get('/:id/cameras', {
        schema: {
            params: getHostByIdSchema,
            response: {
                200: $ref("responseHostAndCamerasSchema")
            }
        }
    }, controller.getHostHandler)

    server.get('/by-name/:name/cameras', {
        schema: {
            params: getHostByNameSchema,
            response: {
                200: $ref("responseHostAndCamerasSchema")
            }
        }
    }, controller.getHostByNameHandler)

    server.register(async function (userRoutes) {
        userRoutes.decorateRequest('user')
        userRoutes.addHook('preValidation', async (request, reply) => {
            await validateJwt(request, reply);
        })

        userRoutes.get('/', {
            schema: {
                response: {
                    200: $ref("responseHostsSchema")
                }
            }
        }, controller.getHostsHandler)

        userRoutes.get('/:id/status', {
            schema: {
                params: getHostByIdSchema,
                response: {
                    200: $ref('responseHostStatusSchema')
                },
            }
        }, controller.getHostStatusHandler)

        userRoutes.get('/:id', {
            schema: {
                params: getHostByIdSchema,
                response: {
                    200: $ref("responseHostSchema")
                }
            }
        }, controller.getHostHandler)
    })

    server.register(async function (adminRoutes) {
        adminRoutes.decorateRequest('user')
        adminRoutes.addHook('preValidation', async (request, reply) => {
            await validateJwt(request, reply);
            await validateAdminRole(request, reply);
        })


        adminRoutes.put('/', {
            schema: {
                body: $ref('updateHostsSchema'),
                response: {
                    201: $ref("responseHostsSchema")
                }
            },
        }, controller.putHostsHandler)

        adminRoutes.put('/:id', {
            schema: {
                params: getHostByIdSchema,
                body: $ref('updateHostSchema'),
                response: {
                    201: $ref("responseHostSchema")
                }
            },
        }, controller.putHostHandler)

        adminRoutes.delete('/:id', {
            schema: {
                params: getHostByIdSchema,
                response: {
                    200: $ref("responseHostSchema")
                }
            },
        }, controller.deleteHostHandler)

        adminRoutes.delete('/', {
            schema: {
                body: $ref('deleteHostsSchema'),
                // response: {
                //     201: $ref("responseHostsSchema")
                // }
            },
        }, controller.deleteHostsHandler)
    })
}