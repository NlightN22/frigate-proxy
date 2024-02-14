import { boolean, z } from "zod";
import { createCameraSchema, responseCameraSchema } from "../camera/camera.schema";
import { buildJsonSchemas } from "fastify-zod";

export const hostCoreSchema = {
    name: z.string(),
    host: z.string()
        .url()
        .refine((value) => {
            return value ? value.startsWith("http://") || value.startsWith("https://") : true;
        },
            // https://github.com/aiji42/zod-i18n/blob/main/README.md
            { params: { i18n: "httpStart" } })
}


export const getHostStatusByIdSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            description: 'Host ID',
        },
    }
}

export const responseHostStatusSchema = z.object({
    id: z.string(),
    ...hostCoreSchema,
    status: z.boolean()
})

export const createHostSchema = z.object({
    ...hostCoreSchema,
    create: z.array(createCameraSchema).optional()
})

export const updateHostSchema = z.object({
    id: z.string(),
    ...hostCoreSchema,
    cameras: z.array(responseCameraSchema).optional()
})
export const responseHostSchema = z.object({
    id: z.string(),
    ...hostCoreSchema,
    cameras: z.array(responseCameraSchema).optional()
})

export const deleteHostSchema = z.object({
    id: z.string().optional(),
    host: hostCoreSchema.host.optional(),
}).refine((data) => {
    return (data.id && !data.host) || (!data.id && data.host);
},
    { params: { i18n: "HostOrIdExist" } })

const getHostsSchema = z.array(responseHostSchema)
export const getHostSchema = deleteHostSchema

export type CreateHostSchema = z.infer<typeof createHostSchema>
export type ResponseHostSchema = z.infer<typeof responseHostSchema>
export type ResponseHostStatisSchema = z.infer<typeof responseHostStatusSchema>
export type UpdateHostSchema = z.infer<typeof updateHostSchema>
export type DeleteHostSchema = z.infer<typeof deleteHostSchema>




export const { schemas: frigateHostSchemas, $ref } = buildJsonSchemas({
    createHostSchema,
    updateHostSchema,
    getHostsSchema,
    getHostSchema,
    responseHostSchema,
    responseHostStatusSchema,
    deleteHostSchema,
},
    { $id: 'hostSchemas' })