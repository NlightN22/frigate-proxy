import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { fastifySwagger } from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import websocket from '@fastify/websocket'
import Fastify from "fastify"
import qs from 'qs'
import { envRateLimit, envTimeWindow } from "./consts"
import { cameraRoutes } from "./modules/camera/camera.route"
import { configRoutes } from "./modules/config/config.route"
import { configSchemas } from "./modules/config/config.schema"
import { configOIDPSchemas } from "./modules/config/oidp/config.oidp.schema"
import { frigateHostsRoutes } from "./modules/frigate-hosts/frigate-hosts.route"
import { frigateHostSchemas } from "./modules/frigate-hosts/frigate-hosts.schema"
import { selectLanguageHook } from "./modules/hooks/select.lang.prehandler"
import { proxyWsRoute } from "./modules/proxy-ws/proxy.ws.route"
import { proxyWsSchemas } from "./modules/proxy-ws/proxy.ws.schema"
import { proxyRoute } from "./modules/proxy/proxy.route"
import { proxySchemas } from "./modules/proxy/proxy.schema"
import { rolesRoutes } from "./modules/roles/roles.route"
import { rolesSchemas } from "./modules/roles/roles.schema"
import { tagsRoutes } from "./modules/tag/tag.route"
import { tagsSchemas } from "./modules/tag/tag.schema"
import { usersRoutes } from "./modules/users/users.route"
import { logger } from './utils/logger'

export interface User {
    id: string,
    name: string,
    roles: string[],
}

declare module 'fastify' {
    export interface FastifyRequest {
        user?: User
    }
}

function buildServer() {

    const fastify = Fastify({
        querystringParser: (str) => qs.parse(str),
        trustProxy: true,
    })

    fastify.register(cors, {
        origin: "*",
    })

    fastify.register(rateLimit, {
        max: envRateLimit,
        timeWindow: envTimeWindow,
        errorResponseBuilder(req, context) {
            logger.debug(`Too many requests from ${req.ip} - ${context.after} / ${context.max}`)
            return {
                statusCode: 429,
                error: 'Too Many Requests',
                message: `I only allow ${context.max} requests per ${context.after} to this Website. Try again soon.`,
                date: Date.now(),
                expiresIn: context.ttl
            }
        },
    })

    fastify.get('/healthcheck', async function () {
        return { status: 'OK' }
    })

    selectLanguageHook(fastify)

    for (const schema of [
        ...frigateHostSchemas,
        ...proxySchemas,
        ...proxyWsSchemas,
        ...rolesSchemas,
        ...configSchemas,
        ...configOIDPSchemas,
        ...tagsSchemas,
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
    fastify.register(tagsRoutes, { prefix: 'apiv1/tags' })
    fastify.register(usersRoutes, { prefix: 'apiv1/users' })
    fastify.register(configRoutes, { prefix: 'apiv1/config' })
    fastify.register(proxyRoute, { prefix: 'proxy' })
    fastify.register(websocket)
    fastify.register(proxyWsRoute, { prefix: 'proxy-ws', config: { rateLimit: false } })
    return fastify
}

export default buildServer