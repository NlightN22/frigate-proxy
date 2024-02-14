import Fastify, { FastifyReply, FastifyRequest } from "fastify"
import { frigateHostSchemas } from "./modules/frigate-hosts/frigate-hosts.schema"
import frigateHostsRoutes from "./modules/frigate-hosts/frigate-hosts.route"
import cameraRoutes from "./modules/camera/camera.route"
import { fastifySwagger } from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import { cameraSchemas } from "./modules/camera/camera.schema"
import proxyRoute from "./modules/proxy/proxy.route"
import proxyWsRoute from "./modules/proxy-ws/proxy.ws.route"
import { logger } from "./utils/logger"
import { proxySchemas } from "./modules/proxy/proxy.schema"
import { proxyWsSchemas } from "./modules/proxy-ws/proxy.ws.schema"
import { rolesRoutes } from "./modules/roles/roles.route"
import { usersRoutes } from "./modules/users/users.route"
import { rolesSchemas } from "./modules/roles/roles.schema"
import i18n from "./modules/translate/i18n.conf"
import { selectLanguageHook } from "./modules/hooks/select.lang.prehandler"
import { z } from "zod"
import { makeZodI18nMap } from "zod-i18n-map"



const fastify = Fastify({
})

fastify.get('/healthcheck', async function () {
    return { status: 'OK' }
})


async function main() {

    selectLanguageHook(fastify)

    for (const schema of [
        ...frigateHostSchemas,
        ...cameraSchemas,
        ...proxySchemas,
        ...proxyWsSchemas,
        ...rolesSchemas
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
    fastify.register(proxyRoute, { prefix: 'proxy' })
    fastify.register(require('@fastify/websocket'))
    fastify.register(proxyWsRoute, { prefix: 'proxy-ws' })

    const testValue = z.object({
        http: z.string().optional()
            .refine((value) => {
                return value ? value.startsWith("http://") || value.startsWith("https://") : true;
            }, { params: { i18n: "httpStart" } }),
    })

    fastify.post('/greet', (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const tested = testValue.parse(request.body)
            reply.send(tested)

        } catch (e) {
            logger.error(e.message)
            reply.code(500).send(e.message)
        }
    })


    try {
        const fastifyOptions = {
            port: 4000,
            host: 'localhost'
        }
        await fastify.listen(fastifyOptions)
        logger.info(`Server ready at ${JSON.stringify(fastifyOptions)}`)
    } catch (e) {
        logger.error(e.message)
        process.exit(1)
    }
}

main()
