import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";
import { responseCameraStateSchema } from "../camera/camera.core.schema";

export const hostCoreSchema = {
    name: z.string(),
    host: z.string()
        .url()
        .refine((value) => {
            return value ? value.startsWith("http://") || value.startsWith("https://") : true;
        },
            // https://github.com/aiji42/zod-i18n/blob/main/README.md
            { params: { i18n: "httpStart" } }),
    enabled: z.boolean().nullable().optional()
}


export const getHostByIdSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            description: 'Host ID',
        },
    }
}

export const getHostByNameSchema = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            description: 'Name',
        },
    }
}

export const getHostByHostSchema = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            description: 'Hostname',
        },
    }
}

export const getHostWithIncludeSchema = {
    type: 'object',
    properties: {
        include: {
            type: 'string',
            description: 'Include another related object to response, e.g `cameras`',
        },
    }
}

export const responseHostStatusSchema = z.object({
    id: z.string(),
    ...hostCoreSchema,
    status: z.boolean(),
})

export const responseHostAndCamerasSchema = z.object({
    id: z.string(),
    ...hostCoreSchema,
}).merge(z.object({
    cameras: z.array(responseCameraStateSchema)
}))

export const createHostSchema = z.object({
    ...hostCoreSchema,
})

export const createHostsSchema = createHostSchema.array()

export const updateHostSchema = z.object({
    id: z.string(),
    ...hostCoreSchema,
})

export const updateHostsSchema = updateHostSchema.array()

export const responseHostCoreSchema = {
    id: z.string(),
    createAt: z.date(),
    updateAt: z.date(),
    name: z.string(),
    host: z.string(),
    enabled: z.boolean().nullable(),
    state: z.boolean().nullable(),
}
export const responseHostSchema = z.object({
    ...responseHostCoreSchema,
})

export const deleteHostSchema = z.object({
    id: z.string()
})
export const deleteHostsSchema = deleteHostSchema.array()

const responseHostsSchema = responseHostSchema.array()
export const getHostSchema = deleteHostSchema

export const cameraStats = z.object({
    name: z.string(),
    state: z.boolean(),
})

export type CreateHostsSchema = z.infer<typeof createHostsSchema>
export type ResponseHostSchema = z.infer<typeof responseHostSchema>
export type ResponseHostStatisSchema = z.infer<typeof responseHostStatusSchema>
export type UpdateHostSchema = z.infer<typeof updateHostSchema>
export type UpdateHostsSchema = z.infer<typeof updateHostsSchema>
export type DeleteHostSchema = z.infer<typeof deleteHostSchema>
export type DeleteHostsSchema = z.infer<typeof deleteHostsSchema>
export type CameraStats = z.infer<typeof cameraStats>

export const { schemas: frigateHostSchemas, $ref } = buildJsonSchemas({
    createHostsSchema,
    updateHostSchema,
    updateHostsSchema,
    getHostSchema,
    responseHostSchema,
    responseHostsSchema,
    responseHostStatusSchema,
    responseHostAndCamerasSchema,
    deleteHostSchema,
    deleteHostsSchema,
},
    { $id: 'hostSchemas' })