import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";
import { ResponseConfigsSchema, responseConfigsSchema } from "../config.schema";

export const putOIDPConfig = z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    clientUsername: z.string(),
    clientPassword: z.string(),
    clientURL: z.string(),
})

export const responseTestOIDPConfig = z.object({
    success: z.boolean()
})

export type PutOIDPConfig = z.infer<typeof putOIDPConfig>
export type ResponseTestOIDPConfig = z.infer<typeof responseTestOIDPConfig>
export type ResponseOIDPConfig =  ResponseConfigsSchema

export const { schemas: configOIDPSchemas, $ref } = buildJsonSchemas({
    putOIDPConfig,
    responseConfigsSchema,
    responseTestOIDPConfig,
},
    { $id: "configOIDPSchemas" }
)