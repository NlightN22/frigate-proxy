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
        },
    ]
]