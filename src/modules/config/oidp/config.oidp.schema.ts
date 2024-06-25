import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";
import { ResponseConfigsSchema, responseConfigsSchema } from "../config.schema";

export const oIDPConfigSchema = z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    clientUsername: z.string(),
    clientPassword: z.string(),
    clientURL: z.string(),
})

export const responseOIDPConfigSchema = z.object({
    success: z.boolean(),
    message: z.string().optional()
})

export type PutOIDPConfig = z.infer<typeof oIDPConfigSchema>
export type GetOIDPConfig = PutOIDPConfig
export type ResponseOIDPConfig = z.infer<typeof responseOIDPConfigSchema>

export const { schemas: configOIDPSchemas, $ref } = buildJsonSchemas({
    oIDPConfigSchema,
    responseConfigsSchema,
    responseOIDPConfigSchema,
},
    { $id: "configOIDPSchemas" }
)