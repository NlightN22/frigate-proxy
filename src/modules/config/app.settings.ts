import { MapSettings } from "./config.service";

export const appSettingsKeys = {
    adminRole: 'adminRole',
    birdsEyeRole: 'birdsEyeRole'
}

export const AppSetting: MapSettings = [
    [
        appSettingsKeys.adminRole,
        {
            description: 'App admin rolename',
            encrypted: false
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