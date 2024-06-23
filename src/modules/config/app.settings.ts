import { Prisma, PrismaClient } from "@prisma/client";
import { MapSettings } from "./config.service";
import { z } from "zod";
import { DefaultArgs } from "@prisma/client/runtime/library";
import { oIDPSettings } from "./oidp/oidp.settings";
import { Setting } from "./config.schema";

export const appSettingsKeys = {
    adminRole: 'adminRole',
    birdsEyeRole: 'birdsEyeRole'
}

export const AppSetting: MapSettings = [
    [
        appSettingsKeys.adminRole,
        {
            description: 'App admin rolename',
            encrypted: false,
            validateFn: async (value, prismaClient: Prisma.AppSettingsDelegate<DefaultArgs>) => {
                const pasrseResult = z.string().safeParse(value).success
                if (!pasrseResult || value === '') return { validate: false, message: 'Admin name is not string or empty'}
                const dbConfig = await prismaClient.findMany()
                const allMapSettings = new Map<string, Setting>(oIDPSettings)
                const allResult = Array.from(allMapSettings).map(([key, setting]) => {
                    const dbItem = dbConfig.find(item => item.key === key);
                    return dbItem ? true : false
                })
                if (!allResult.includes(false)) {
                    return { validate: true }
                }
                return { validate: false, message: 'You must set OIDP settings first' }
            },
        }
    ],
    [
        appSettingsKeys.birdsEyeRole,
        {
            description: 'App birdseye rolename',
            encrypted: false
        }
    ]
]