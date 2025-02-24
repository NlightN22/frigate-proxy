import { z } from "zod";

export const responseCameraCoreSchema = z.object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    name: z.string(),
    url: z.string().url().optional(),
    state: z.boolean().nullable(),
    config: z.record(z.any()).nullable().optional(),
})

export const responseCameraStateSchema = z.object({
    id: z.string(),
    name: z.string(),
    state: z.boolean().nullable().optional(),
})