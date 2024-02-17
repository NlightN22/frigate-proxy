import { FastifyInstance } from "fastify";
import { $ref, getHostStatusByIdSchema, responseHostStatusSchema } from "./frigate-hosts.schema";
import { predefinedRoles } from "../../consts";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { validateRole } from "../hooks/roles.prehandler";
import FrigateHostController from "./frigate-hosts.controller";

export async function frigateHostsRoutes(server: FastifyInstance) {

    const controller = new FrigateHostController()

    // todo enable after tests
    // const allowedRoles = [
    //     'user',
    // ]
    // server.decorateRequest('user')
    // server.addHook('preHandler', async (request, reply) => {
    //     await validateJwt(request, reply);
    //     await validateRole(request, reply, allowedRoles);
    // })

    server.post('/', {
        schema:{
            body: $ref('createHostSchema'),
            response: {
                201: $ref("responseHostSchema")
            }
        }
    }, controller.createHostHandler)

    server.get('/', {
        schema:{
            response: {
                200: $ref("getHostsSchema")
            }
        }
    }, controller.getHostsHandler)

    server.get('/:id', {
        schema:{
            params: getHostStatusByIdSchema,
            response: {
                200: $ref("responseHostSchema")
            }
        }
    }, controller.getHostHandler)

    server.get('/:id/status', {
        schema:{
            params: getHostStatusByIdSchema,
            response: {
                200: $ref('responseHostStatusSchema')
            },
        }
    }, controller.getHostStatusHandler)

    server.delete('/:id', {
        schema:{
            params: getHostStatusByIdSchema,
            response: {
                200: $ref("responseHostSchema")
            }
        }
    }, controller.deleteHostByIdHandler)
    
    server.put('/', {
        schema:{
            body: $ref('updateHostSchema'),
            response: {
                201: $ref("responseHostSchema")
            }
        }
    }, controller.putHostHandler)
    
    server.delete('/', {
        schema:{
            body: $ref('deleteHostSchema'),
            response: {
                200: $ref("responseHostSchema")
            }
        }
    }, controller.deleteHostHandler)

}