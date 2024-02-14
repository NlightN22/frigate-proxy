import { FastifyInstance } from "fastify";
import { createHostHandler, deleteHostByIdHandler, deleteHostHandler, getHostHandler, getHostStatusHandler, getHostsHandler, putHostHandler } from "./frigate-hosts.controller";
import { $ref, getHostStatusByIdSchema, responseHostStatusSchema } from "./frigate-hosts.schema";
import { validateJwt } from "../hooks/jwks-rsa.prehandler";
import { validateRole } from "../hooks/roles.prehandler";
import { predefinedRoles } from "../../consts";

async function frigateHostsRoutes(server: FastifyInstance) {

    // todo enable after tests
    // const allowedRoles = [
    //     predefinedRoles.admin
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
    }, createHostHandler)

    server.get('/', {
        schema:{
            response: {
                200: $ref("getHostsSchema")
            }
        }
    }, getHostsHandler)

    server.get('/:id', {
        schema:{
            params: getHostStatusByIdSchema,
            response: {
                200: $ref("responseHostSchema")
            }
        }
    }, getHostHandler)

    server.get('/:id/status', {
        schema:{
            params: getHostStatusByIdSchema,
            response: {
                200: $ref('responseHostStatusSchema')
            },
        }
    }, getHostStatusHandler)

    server.delete('/:id', {
        schema:{
            params: getHostStatusByIdSchema,
            response: {
                200: $ref("responseHostSchema")
            }
        }
    }, deleteHostByIdHandler)
    
    server.put('/', {
        schema:{
            body: $ref('updateHostSchema'),
            response: {
                201: $ref("responseHostSchema")
            }
        }
    }, putHostHandler)
    
    server.delete('/', {
        schema:{
            body: $ref('deleteHostSchema'),
            response: {
                200: $ref("responseHostSchema")
            }
        }
    }, deleteHostHandler)

}

export default frigateHostsRoutes