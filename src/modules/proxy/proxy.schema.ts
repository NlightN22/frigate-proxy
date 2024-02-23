import { buildJsonSchemas } from "fastify-zod"
import { z } from "zod"

export const proxyParams = z.object({
    hostName: z.string()
})

export const proxyParamschema = {
    type: 'object',
    properties: {
        hostName: {
            type: 'string',
            description: 'Target hostname URL, e.g. localhost:4000',
        },
    }
}


export const { schemas: proxySchemas, $ref } = buildJsonSchemas({ proxyParams },
    { $id: 'proxySchemas' })

export type ProxyParamsSchema = z.infer<typeof proxyParams>