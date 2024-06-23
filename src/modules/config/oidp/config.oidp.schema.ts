import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";
import { ResponseConfigsSchema, responseConfigsSchema } from "../config.shema";

export const putOIDPConfig = z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    clientUsername: z.string(),
    clientPassword: z.string(),
    clientURL: z.string(),
})

export type PutOIDPConfig = z.infer<typeof putOIDPConfig>

export type ResponseOIDPConfig =  ResponseConfigsSchema

export const { schemas: configOIDPSchemas, $ref } = buildJsonSchemas({
    putOIDPConfig,
    responseConfigsSchema,
},
    { $id: "configOIDPSchemas" }
)