import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

export const tagSchema = z.object({
    id: z.string(),
    value: z.string(),
})

export const putTagSchema = z.object({
    id: z.string().optional(),
    value: z.string(),
})

export const tagsArraySchema = tagSchema.array()

export const getTagByIdSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            description: 'Tag ID',
        },
    }
}


export type ResponseTagSchema = z.infer<typeof tagSchema>
export type ResponseTagsSchema = z.infer<typeof tagsArraySchema>
export type PutTagSchema = z.infer<typeof putTagSchema>

export const { schemas: tagsSchemas, $ref } = buildJsonSchemas({
    responseTagSchema: tagSchema,
    responseTagsSchema: tagsArraySchema,
    putTagSchema,
},
    { $id: 'tagsSchemas' }
)