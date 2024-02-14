import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";
import { responseRoleSchema } from "../roles/roles.schema";

export const cameraSchema = z.object({
    id: z.string(),
    createAt: z.date(),
    updateAt: z.date(),
    name: z.string(),
    url: z.string().nullable(),
    frigateHostId: z.string().nullable(),
    rolesIDs: z.array(z.string()),
  });

export const cameraCore = {
    name: z.string(),
    frigateHostId: z.string().optional(),
    url: z.string().url().optional(),
}
/**
 * Without set frigate host create camera only for live view.
 */
export const createCameraSchema = z.object(
    cameraCore
).refine((data) => {
    return (data.frigateHostId && !data.url) || (!data.frigateHostId && data.url);
},
    { params: { i18n: "HostOrUrlExist" } })

export const responseCameraSchema = z.object({
    id: z.string(),
    roles: responseRoleSchema.array().optional(),
    ...cameraCore
})

export const updateCameraSchema = z.object({
    id: z.string(),
    ...cameraCore,
}).refine((data) => {
    return (data.frigateHostId && !data.url) || (!data.frigateHostId && data.url);
},
    { params: { i18n: "HostOrUrlExist" } })


const getCamerasSchema = z.array(responseCameraSchema)

export type CreateCameraSchema = z.infer<typeof createCameraSchema>
export type ResponseCameraSchema = z.infer<typeof responseCameraSchema>
export type UpdateCameraSchema = z.infer<typeof updateCameraSchema>

export const { schemas: cameraSchemas, $ref } = buildJsonSchemas({
    createCameraSchema,
    responseCameraSchema,
    updateCameraSchema,
    getCamerasSchema
},
    { $id: 'cameraSchemas' })