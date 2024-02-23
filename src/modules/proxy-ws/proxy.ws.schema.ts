import { buildJsonSchemas } from "fastify-zod"
import { z } from "zod"

export const proxyWsParams = z.object({
    hostName: z.string()
})

export const proxyWsParamsSchema = {
    type: 'object',
    properties: {
        hostName: {
            type: 'string',
            description: 'Target hostname URL, e.g. localhost:4000',
        },
    }
}

export const { schemas: proxyWsSchemas, $ref } = buildJsonSchemas({proxyWsParams: proxyWsParams},
    {$id: 'proxyWsSchemas'})

export type ProxyWsParamsSchema = z.infer<typeof proxyWsParams>
