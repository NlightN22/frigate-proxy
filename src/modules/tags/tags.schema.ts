import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";
import { responseCameraCoreSchema } from "../camera/camera.core.schema";

const tag = z.object({
    id: z.string(),
    value: z.string(),
})

const tags = tag.array()

const addTagCamerasSchema = z.object({
    cameras: responseCameraCoreSchema
}).merge(tag)

const responseTagCamerasSchema = addTagCamerasSchema

export type ResponseTagsSchema = z.infer<typeof tags>
export type PutTagCameraSchema = z.infer<typeof addTagCamerasSchema>
// export type ResponseRoleSchema = z.infer<typeof responseRolesAndCamerasSchema>
// export type AddRoleCamerasSchema = z.infer<typeof addRoleCamerasSchema>
// export type DeleteRoleCamerasSchema = z.infer<typeof deleteRoleCamerasSchema>
// export type MissingRolesSchema = z.infer<typeof missingRolesSchema>
// export type ResponseRolesSchema = z.infer<typeof responseRolesSchema>

export const { schemas: rolesSchemas, $ref } = buildJsonSchemas({
    responseTagsSchema: tags,
    addTagCamerasSchema,
    responseTagCamerasSchema,
},
    { $id: 'tagsSchemas' }
)