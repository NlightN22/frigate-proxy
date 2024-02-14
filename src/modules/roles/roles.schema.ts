import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

export const getRoleByIdSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            description: 'Role ID',
        },
    }
}

export const responseRoleSchema = z.object({
    id: z.string(),
    name: z.string(),
})

const responseRolesSchema = z.array(responseRoleSchema)

export type ResponseRoleSchema = z.infer<typeof responseRoleSchema>
export type ResponseRolesSchema = z.infer<typeof responseRolesSchema>

export const { schemas: rolesSchemas, $ref } = buildJsonSchemas({
    responseRoleSchema,
    responseRolesSchema
},
    { $id: 'rolesSchemas' }
)