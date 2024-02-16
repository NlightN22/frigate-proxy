import { FastifyInstance } from "fastify";
import { getConfigsController, getSettingController, getSettingsController,  putConfigController } from "./confg.controller";
import { getConfigSchema } from "./config.shema";

export async function configRoutes(server: FastifyInstance) {

    server.get('/settings', {}, getSettingsController)
    server.get('/', {}, getConfigsController)
    server.get('/:key', {
        schema: {
            params: getConfigSchema
        }
    }, getSettingController)
    server.put('/', {
    }, putConfigController)
}