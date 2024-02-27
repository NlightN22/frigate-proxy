import { FastifyInstance } from "fastify";
import { $ref, getHostStatusByIdSchema, getHostWithIncludeSchema, responseHostStatusSchema } from "./frigate-hosts.schema";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { validateRole } from "../hooks/roles.prehandler";
import FrigateHostController from "./frigate-hosts.controller";

export async function frigateHostsRoutes(server: FastifyInstance) {

    const controller = new FrigateHostController()

    server.decorateRequest('user')
    server.addHook('preValidation', async (request, reply) => {
        await validateJwt(request, reply);
    })

    // const allowedRoles = ['user',]
    // await validateRole(request, reply, allowedRoles);
    server.get('/', {
        schema: {
            response: {
                200: $ref("responseHostsSchema")
            }
        }
    }, controller.getHostsHandler)

    server.get('/:id', {
        schema: {
            params: getHostStatusByIdSchema,
            response: {
                200: $ref("responseHostSchema")
            }
        }
    }, controller.getHostHandler)

    server.get('/:id/status', {
        schema: {
            params: getHostStatusByIdSchema,
            response: {
                200: $ref('responseHostStatusSchema')
            },
        }
    }, controller.getHostStatusHandler)

    server.put('/', {
        schema: {
            body: $ref('updateHostsSchema'),
            response: {
                201: $ref("responseHostsSchema")
            }
        },
        preValidation: async (request, reply) => {
            const allowedRoles = ['admin',]
            await validateRole(request, reply, allowedRoles);
        }
    }, controller.putHostsHandler)

    server.put('/:id', {
        schema: {
            params: getHostStatusByIdSchema,
            body: $ref('updateHostSchema'),
            response: {
                201: $ref("responseHostSchema")
            }
        },
        preValidation: async (request, reply) => {
            const allowedRoles = ['admin',]
            await validateRole(request, reply, allowedRoles);
        }
    }, controller.putHostHandler)

    server.delete('/:id', {
        schema: {
            params: getHostStatusByIdSchema,
            response: {
                200: $ref("responseHostSchema")
            }
        },
        preValidation: async (request, reply) => {
            const allowedRoles = ['admin',]
            await validateRole(request, reply, allowedRoles);
        }
    }, controller.deleteHostHandler)

    server.delete('/', {
        schema: {
            body: $ref('deleteHostsSchema'),
            // response: {
            //     200: $ref("responseHostsSchema")
            // }
        },
        preValidation: async (request, reply) => {
            const allowedRoles = ['admin',]
            await validateRole(request, reply, allowedRoles);
        }
    }, controller.deleteHostsHandler)

}