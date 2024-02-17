import Fastify from "fastify"
import { frigateHostSchemas } from "./modules/frigate-hosts/frigate-hosts.schema"
import { fastifySwagger } from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import { cameraSchemas } from "./modules/camera/camera.schema"
import { proxySchemas } from "./modules/proxy/proxy.schema"
import { proxyWsSchemas } from "./modules/proxy-ws/proxy.ws.schema"
import { rolesSchemas } from "./modules/roles/roles.schema"
import { selectLanguageHook } from "./modules/hooks/select.lang.prehandler"
import { configSchemas } from "./modules/config/config.shema"
import { User } from "./modules/users/users.schema"
import { cameraRoutes } from "./modules/camera/camera.route"
import { frigateHostsRoutes } from "./modules/frigate-hosts/frigate-hosts.route"
import { rolesRoutes } from "./modules/roles/roles.route"
import { usersRoutes } from "./modules/users/users.route"
import { configRoutes } from "./modules/config/config.router"
import { proxyRoute } from "./modules/proxy/proxy.route"
import websocket from '@fastify/websocket'
import { proxyWsRoute } from "./modules/proxy-ws/proxy.ws.route"


declare module 'fastify' {
    export interface FastifyRequest {
        user?: User
    }
}

function buildServer() {

    const fastify = Fastify({
    })

    fastify.get('/healthcheck', async function () {
        return { status: 'OK' }
    })

    selectLanguageHook(fastify)

    for (const schema of [
        ...frigateHostSchemas,
        ...cameraSchemas,
        ...proxySchemas,
        ...proxyWsSchemas,
        ...rolesSchemas,
        ...configSchemas,
    ]) {
        fastify.addSchema(schema)
    }

    fastify.register(fastifySwagger)

    fastify.register(fastifySwaggerUi, {
        routePrefix: '/documentation',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false
        },
        uiHooks: {
            onRequest: function (request, reply, next) { next() },
            preHandler: function (request, reply, next) { next() }
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
        transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
        transformSpecificationClone: true
    })

    fastify.register(cameraRoutes, { prefix: 'apiv1/cameras' })
    fastify.register(frigateHostsRoutes, { prefix: 'apiv1/frigate-hosts' })
    fastify.register(rolesRoutes, { prefix: 'apiv1/roles' })
    fastify.register(usersRoutes, { prefix: 'apiv1/users' })
    fastify.register(configRoutes, { prefix: 'apiv1/config' })
    fastify.register(proxyRoute, { prefix: 'proxy' })
    fastify.register(websocket)
    fastify.register(proxyWsRoute, { prefix: 'proxy-ws' })

    return fastify
}

export default buildServer