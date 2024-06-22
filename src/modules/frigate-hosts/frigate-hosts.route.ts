import { FastifyInstance } from "fastify";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { validateRole } from "../hooks/roles.prehandler";
import FrigateHostController from "./frigate-hosts.controller";
import { $ref, getHostByHostSchema, getHostByIdSchema, getHostByNameSchema } from "./frigate-hosts.schema";

export async function frigateHostsRoutes(server: FastifyInstance) {

    const controller = new FrigateHostController()

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

    // Routes for authenticated users

    server.decorateRequest('user')
    server.get('/', {
        preValidation: [validateJwt],
        schema: {
            response: {
                200: $ref("responseHostsSchema")
            }
        }
    }, controller.getHostsHandler)

    server.get('/:id', {
        preValidation: [validateJwt],
        schema: {
            params: getHostByIdSchema,
            response: {
                200: $ref("responseHostSchema")
            }
        }
    }, controller.getHostHandler)

    server.get('/:id/status', {
        preValidation: [validateJwt],
        schema: {
            params: getHostByIdSchema,
            response: {
                200: $ref('responseHostStatusSchema')
            },
        }
    }, controller.getHostStatusHandler)

    server.put('/', {
        preValidation: async (request, reply) => {
            await validateJwt(request, reply)
            const allowedRoles = ['admin',]
            await validateRole(request, reply, allowedRoles);
        },
        schema: {
            body: $ref('updateHostsSchema'),
            response: {
                201: $ref("responseHostsSchema")
            }
        },
    }, controller.putHostsHandler)

    server.put('/:id', {
        preValidation: async (request, reply) => {
            await validateJwt(request, reply)
            const allowedRoles = ['admin',]
            await validateRole(request, reply, allowedRoles);
        },
        schema: {
            params: getHostByIdSchema,
            body: $ref('updateHostSchema'),
            response: {
                201: $ref("responseHostSchema")
            }
        },
    }, controller.putHostHandler)

    server.delete('/:id', {
        preValidation: async (request, reply) => {
            await validateJwt(request, reply)
            const allowedRoles = ['admin',]
            await validateRole(request, reply, allowedRoles);
        },
        schema: {
            params: getHostByIdSchema,
            response: {
                200: $ref("responseHostSchema")
            }
        },
    }, controller.deleteHostHandler)

    server.delete('/', {
        preValidation: async (request, reply) => {
            await validateJwt(request, reply)
            const allowedRoles = ['admin',]
            await validateRole(request, reply, allowedRoles);
        },
        schema: {
            body: $ref('deleteHostsSchema'),
            // response: {
            //     200: $ref("responseHostsSchema")
            // }
        },
    }, controller.deleteHostsHandler)
}