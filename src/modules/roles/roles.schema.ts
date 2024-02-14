import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";
import { cameraSchema, responseCameraSchema } from "../camera/camera.schema";

const roleSchema = z.object({
    id: z.string(),
    createAt: z.date(),
    updateAt: z.date(),
    name: z.string(),
    cameraIDs: z.array(z.string()),
});

const missingRolesSchema = z.array(
    z.intersection(
        z.object({
            cameras: z.array(cameraSchema),
        }),
        roleSchema
    )
);

export const getRoleByIdSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            description: 'Role ID',
        },
    }
}

const rolesCore = {
    id: z.string(),
    name: z.string(),
}

export const responseRoleSchema = z.object({
    ...rolesCore
})

export const responseRolesAndCamerasSchema = z.object({
    ...rolesCore,
    camera: z.object({
        id: z.string(),
        createAt: z.date(),
        updateAt: z.date(),
        name: z.string(),
        url: z.string().optional(),
        frigateHostId: z.string().optional(),
        rolesIDs: z.string().array()
    })
})

const responseRolesSchema = z.array(responseRoleSchema)

export type ResponseRoleSchema = z.infer<typeof responseRoleSchema>
export type MissingRolesSchema = z.infer<typeof missingRolesSchema>
export type ResponseRolesSchema = z.infer<typeof responseRolesSchema>

export const { schemas: rolesSchemas, $ref } = buildJsonSchemas({
    responseRoleSchema,
    responseRolesSchema
},
    { $id: 'rolesSchemas' }
)