import { buildJsonSchemas } from "fastify-zod"
import { z } from "zod"

export const proxyQueryParams = z.object({
    hostName: z.string()
})

export const proxyQueryJsonSchema = {
    type: 'object',
    properties: {
        hostName: {
            type: 'string',
            description: 'Target hostname URL',
        },
    }
}


export const { schemas: proxySchemas, $ref } = buildJsonSchemas({ proxyQueryParams },
    { $id: 'proxySchemas' })

export type ProxyQueryParams = z.infer<typeof proxyQueryParams>