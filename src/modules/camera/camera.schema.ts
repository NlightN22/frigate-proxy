import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";
import { responseHostSchema } from "../frigate-hosts/frigate-hosts.schema";
import { responseRoleSchema } from "../roles/roles.schema";
import { responseCameraCoreSchema, responseCameraStateSchema } from "./camera.core.schema";
import { tagsArraySchema } from "../tag/tag.schema";

export const getByHostIdSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            description: 'Host ID',
        },
    }
}

export const getByCameraIdSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            description: 'Camera ID',
        },
    }
}


export const responseCameraSchema = responseCameraCoreSchema.merge(z.object({
    frigateHost: responseHostSchema.optional(),
    roles: responseRoleSchema.array().optional(),
    tags: tagsArraySchema.optional(),
}))

export const responseCamerasSchema = responseCameraSchema.array()

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
    responseCameraStateSchema,
    responseCamerasSchema,
    updateCameraSchema,
},
    { $id: 'cameraSchemas' })