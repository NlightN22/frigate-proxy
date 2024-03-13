import { z } from "zod";
import { MapSettings } from "./config.service";

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
        }
    ],
    [
        oidpSettingsKeys.clientSecret,
        {
            description: 'OIDP Client secret',
            encrypted: true,
        }
    ],
    [
        oidpSettingsKeys.clientUsername,
        {
            description: 'OIDP Client username',
            encrypted: false,
            validateFn: (value) => z.string().safeParse(value).success,
        },
    ],
    [
        oidpSettingsKeys.clientPassword,
        {
            description: 'OIDP Client password',
            encrypted: true,
        },
    ],
    [
        oidpSettingsKeys.realmUrl,
        {
            description: 'OIDP realm URL path',
            encrypted: false,
            validateFn: async (value) => {
                const { testJwksClientInitialization } = await import("../hooks/jwks-rsa.prehandler")
                const parsedURL = z.string().url().parse(value)
                return await testJwksClientInitialization(parsedURL)
            },
        },
    ]
]