import { FastifyInstance } from "fastify";
import ConfigOIDPController from "./config.oidp.controller";
import { $ref } from "./config.oidp.schema";

export async function configOIDPRoutes(server: FastifyInstance) {
    const configOIDPController = new ConfigOIDPController()
    server.put('/', {
        schema: {
            body: $ref('putOIDPConfig'), 
            response: { 201: $ref('responseConfigsSchema')},
        },
    }, configOIDPController.putOIDPConfigHandler)

    server.put('/test', {
        schema: {
            body: $ref('putOIDPConfig'), 
            response: { 200: $ref('responseTestOIDPConfig')},
        },
    }, configOIDPController.putTestOIDPConfigHandler)

    server.get('/', {
        schema: {
            response: { 200: $ref('responseConfigsSchema')},
        },
    }, configOIDPController.getConfigsController)
}