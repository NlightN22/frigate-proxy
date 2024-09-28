import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";
import { responseCameraCoreSchema } from "../camera/camera.core.schema";

const tag = z.object({
    id: z.string(),
    value: z.string(),
})


const tagCameras = z.object({
    id: z.string(),
    name: z.string(),
})

export const putTagCamerasSchema = z.object({
    cameras: tagCameras.array()
}).merge(tag)

const responseTagCamerasSchema = tag.merge(z.object({
    cameras: tagCameras.array()
}))

export const getTagByIdSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            description: 'Tag ID',
        },
    }
}

const responseTagsCamerasSchema = responseTagCamerasSchema.array()

export type ResponseTagSchema = z.infer<typeof responseTagCamerasSchema>
export type ResponseTagsSchema = z.infer<typeof responseTagsCamerasSchema>
export type PutTagCameraSchema = z.infer<typeof putTagCamerasSchema>

export const { schemas: rolesSchemas, $ref } = buildJsonSchemas({
    responseTagCamerasSchema,
    responseTagsCamerasSchema,
    putTagCamerasSchema,
},
    { $id: 'tagsSchemas' }
)