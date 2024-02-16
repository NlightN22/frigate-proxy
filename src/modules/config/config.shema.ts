import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";

export const putConfigSchema = z.object({
    key: z.string(),
    value: z.string(),
    encrypted: z.boolean(),
    name: z.string().optional(),
})

export const getConfigSchema = {
    type: 'object',
    properties: {
        key: {
            type: 'string',
            description: 'Config key',
        },
    }
}

export type PutConfigSchema = z.infer<typeof putConfigSchema>

export const { schemas: configSchemas, $ref } = buildJsonSchemas({
    putConfigSchema
},
    { $id: "configSchemas" }
)