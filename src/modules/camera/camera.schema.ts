import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";

export const responseCameraCoreSchema = {
    id: z.string(),
    createAt: z.date(),
    updateAt: z.date(),
    name: z.string(),
    url: z.string().url().optional(),
    state: z.boolean().nullable(),
    config: z.record(z.any()).nullable().optional(),
}

const hostCore = {
    id: z.string(),
    createAt: z.date(),
    updateAt: z.date(),
    name: z.string(),
    host: z.string(),
}

const roleCore = {
    id: z.string(),
    name: z.string(),
    createAt: z.date(),
    updateAt: z.date(),
}

export const responseCameraSchema = z.object({
    ...responseCameraCoreSchema,
    frigateHost: z.object({ ...hostCore }).optional(),
    roles: z.object({ ...roleCore }).array().optional(),
})

export const responseCamerasSchema = z.object({
    ...responseCameraCoreSchema,
    frigateHost: z.object({ ...hostCore }).optional(),
    roles: z.object({ ...roleCore }).array().optional(),
}).array()


/**
 * Without set frigate host create camera only for live view.
 */
export const createCameraSchema = z.object({
    name: z.string(),
    url: z.string().url()
})

export const updateCameraSchema = z.object({
    id: z.string(),
    name: z.string(),
    frigateHostId: z.string().optional(),
    url: z.string().url().optional(),
}).refine((data) => {
    return (data.frigateHostId && !data.url) || (!data.frigateHostId && data.url);
},
    { params: { i18n: "HostOrUrlExist" } })


export type CreateCameraSchema = z.infer<typeof createCameraSchema>
export type ResponseCameraSchema = z.infer<typeof responseCameraSchema>
export type ResponseCamerasSchema = z.infer<typeof responseCamerasSchema>
export type UpdateCameraSchema = z.infer<typeof updateCameraSchema>

export const { schemas: cameraSchemas, $ref } = buildJsonSchemas({
    createCameraSchema,
    responseCameraSchema,
    responseCamerasSchema,
    updateCameraSchema,
},
    { $id: 'cameraSchemas' })