import { z } from "zod";
import { MapSettings } from "../config.service";

export const oidpSettingsKeys = {
    clientId: 'oidpClientId',
    clientSecret: 'oidpClientSecret',
    clientUsername: 'oidpClientUsername',
    clientPassword: 'oidpClientPassword',
    realmUrl: 'oidpRealmUrl',
}

export const oIDPSettings: MapSettings = [
    [
        oidpSettingsKeys.clientId,
        {
            description: 'OIDP Client ID',
            encrypted: false,
            validateFn: (value) => ({ validate: z.string().safeParse(value).success }),
        }
    ],
    [
        oidpSettingsKeys.clientSecret,
        {
            description: 'OIDP Client secret',
            encrypted: true,
            validateFn: (value) => ({ validate: z.string().safeParse(value).success }),
        }
    ],
    [
        oidpSettingsKeys.clientUsername,
        {
            description: 'OIDP Client username',
            encrypted: false,
            validateFn: (value) => ({ validate: z.string().safeParse(value).success }),
        },
    ],
    [
        oidpSettingsKeys.clientPassword,
        {
            description: 'OIDP Client password',
            encrypted: true,
            validateFn: (value) => ({ validate: z.string().safeParse(value).success }),
        },
    ],
    [
        oidpSettingsKeys.realmUrl,
        {
            description: 'OIDP realm URL path',
            encrypted: false,
            validateFn: async (value) => {
                const { testJwksClientInitialization } = await import("../../hooks/jwks-rsa.prehandler")
                const parsedURL = z.string().url().parse(value)
                const result = await testJwksClientInitialization(parsedURL)
                return result ? { validate: true } : { validate: false, message: 'JWKS Client test not success' }
            },
        },
    ]
]