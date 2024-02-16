import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";
import { cameraSchema, responseCameraSchema } from "../camera/camera.schema";

const roleSchema = z.object({
    id: z.string(),
    createAt: z.date(),
    updateAt: z.date(),
    name: z.string(),
    cameraIDs: z.string().array(),
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
const roleCoreObject = z.object(rolesCore)

export const addRoleCamerasSchema = z.object({
    cameraIDs: z.string().array()
})
export const deleteRoleCamerasSchema = addRoleCamerasSchema


const ResponseCoreSchema = ({
    id: z.string(),
    name: z.string(),
    createAt: z.date(),
    updateAt: z.date(),
})
export const responseRoleSchema = z.object(ResponseCoreSchema)

export const responseRolesAndCamerasSchema = z.object({
    ...ResponseCoreSchema,
    cameras: z.object({
        id: z.string(),
        createAt: z.date(),
        updateAt: z.date(),
        name: z.string(),
        url: z.string().optional(),
        frigateHostId: z.string().optional(),
        rolesIDs: z.string().array()
    }).array().optional()
})

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