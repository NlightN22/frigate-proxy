import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";
import { responseCameraCoreSchema } from "../camera/camera.core.schema";

export const tagSchema = z.object({
    id: z.string(),
    value: z.string(),
})

export const tagsArraySchema = tagSchema.array()

export const putTagCamerasSchema = z.object({
    id: z.string().optional(),
    value: z.string(),
    cameraIds: z.string().array()
})

const responseTagCamerasSchema = tagSchema.merge(z.object({
    cameras: z.string().array()
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

export const { schemas: tagsSchemas, $ref } = buildJsonSchemas({
    responseTagCamerasSchema,
    responseTagsCamerasSchema,
    putTagCamerasSchema,
},
    { $id: 'tagsSchemas' }
)