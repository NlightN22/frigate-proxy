import { FastifyInstance } from "fastify";
import ConfigOIDPController from "./config.oidp.controller";
import { $ref } from "./config.oidp.schema";

export async function configOIDPRoutes(server: FastifyInstance) {
    const configOIDPController = new ConfigOIDPController()
    server.put('/', {
        schema: {
            body: $ref('oIDPConfigSchema'), 
            response: { 201: $ref('responseOIDPConfigSchema')},
        },
    }, configOIDPController.putOIDPConfigHandler)

    server.put('/test', {
        schema: {
            body: $ref('oIDPConfigSchema'), 
            response: { 200: $ref('responseOIDPConfigSchema')},
        },
    }, configOIDPController.putTestOIDPConfigHandler)

    server.get('/', {
        schema: {
            response: { 200: $ref('oIDPConfigSchema')},
        },
    }, configOIDPController.getConfigsController)
}