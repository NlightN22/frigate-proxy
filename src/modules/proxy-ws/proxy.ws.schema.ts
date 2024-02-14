import { buildJsonSchemas } from "fastify-zod"
import { z } from "zod"

export const proxyWsQueryParams = z.object({
    hostName: z.string({
        required_error: 'Hostname is required',
        invalid_type_error: 'Hostname must be a string'
    })
})

export const proxyWsQueryJsonSchema = {
    type: 'object',
    properties: {
        hostName: {
            type: 'string',
            description: 'Target hostname URL',
        },
    },
    required: ['hostName']
}

export const { schemas: proxyWsSchemas, $ref } = buildJsonSchemas({proxyWQueryParams: proxyWsQueryParams},
    {$id: 'proxyWsSchemas'})