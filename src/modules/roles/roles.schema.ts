import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";
import { responseCameraSchema, responseCamerasSchema } from "../camera/camera.schema";

const cameraSchema = z.object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    name: z.string(),
    url: z.string().nullable(),
    frigateHostId: z.string().nullable(),
    rolesIDs: z.array(z.string()),
    state: z.boolean().nullable(),
});

const missingRoleSchema = z.object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    name: z.string(),
    cameraIDs: z.array(z.string()),
    cameras: z.array(cameraSchema),
});

const missingRolesSchema = z.array(missingRoleSchema);

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
const roleCoreObject = z.object(rolesCore)

export const addRoleCamerasSchema = z.object({
    cameraIDs: z.string().array()
})
export const deleteRoleCamerasSchema = addRoleCamerasSchema

const responseCoreSchema = z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
})
export const responseRoleSchema = responseCoreSchema

export const responseRolesAndCamerasSchema = responseCoreSchema.merge(z.object({
    cameras: responseCamerasSchema
}))

const responseRolesSchema = z.array(responseRoleSchema)

export type RoleCoreSchema = z.infer<typeof roleCoreObject>
export type ResponseRoleSchema = z.infer<typeof responseRolesAndCamerasSchema>
export type AddRoleCamerasSchema = z.infer<typeof addRoleCamerasSchema>
export type DeleteRoleCamerasSchema = z.infer<typeof deleteRoleCamerasSchema>
export type MissingRolesSchema = z.infer<typeof missingRolesSchema>
export type ResponseRolesSchema = z.infer<typeof responseRolesSchema>

export const { schemas: rolesSchemas, $ref } = buildJsonSchemas({
    responseRoleSchema,
    responseRolesAndCamerasSchema,
    addRoleCamerasSchema,
    deleteRoleCamerasSchema,
    responseRolesSchema,
},
    { $id: 'rolesSchemas' }
)