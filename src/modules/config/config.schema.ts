import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";

export const configCore = {
    key: z.string(),
    value: z.string(),
}

export const putConfigSchema = z.object({
    value: z.string(),
})
export const putConfigsSchema = z.object({
    ...configCore
}).array()

export const paramConfigSchema = {
    type: 'object',
    properties: {
        key: {
            type: 'string',
            description: 'Config key',
        },
    }
}

export const responseConfigSchema = z.object({
    ...configCore,
    description: z.string(),
    encrypted: z.boolean(),
})
export const responseConfigsSchema = responseConfigSchema.array()

export type PutConfigSchema = z.infer<typeof putConfigSchema>
export type PutConfigsSchema = z.infer<typeof putConfigsSchema>
export type ResponseConfigSchema = z.infer<typeof responseConfigSchema>
export type ResponseConfigsSchema = z.infer<typeof responseConfigsSchema>

export const { schemas: configSchemas, $ref } = buildJsonSchemas({
    putConfigSchema,
    putConfigsSchema,
    responseConfigSchema,
    responseConfigsSchema
},
    { $id: "configSchemas" }
)