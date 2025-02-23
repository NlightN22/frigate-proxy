import { AxiosError } from "axios";
import { z } from "zod";
import { deepEqual } from "../../../utils/deep.equal";
import { logger } from "../../../utils/logger";
import prisma from "../../../utils/prisma";
import { ErrorApp } from "../../hooks/error.handler";
import { OIDPConfigService, RequestAccessTokenByPasswordSchema } from "../../oidp/oidp.schema";
import OIDPService from "../../oidp/oidp.service";
import ConfigService from "../config.service";
import { PutOIDPConfig, ResponseOIDPConfig, oIDPConfigSchema } from "./config.oidp.schema";
import { oidpSettingsKeys } from "./oidp.settings";

class ConfigOIDPService {
    private static _instance: ConfigOIDPService
    configService = ConfigService.getInstance()
    private oidpService: OIDPService
    prismaClient = prisma.appSettings

    private constructor() {
        logger.debug(`ConfigOIDPService initialized`)
    }

    public static getInstance() {
        if (!ConfigOIDPService._instance) {
            ConfigOIDPService._instance = new ConfigOIDPService()
        }
        return ConfigOIDPService._instance
    }
    async saveOIDPconfig(inputOIDPConfig: PutOIDPConfig): Promise<ResponseOIDPConfig> {
        const result = await this.testOIDPconfig(inputOIDPConfig)
        if (result) {
            await this.configService.saveConfigs([
                {
                    key: oidpSettingsKeys.clientId,
                    value: inputOIDPConfig.clientId
                },
                {
                    key: oidpSettingsKeys.clientPassword,
                    value: inputOIDPConfig.clientPassword
                },
                {
                    key: oidpSettingsKeys.clientSecret,
                    value: inputOIDPConfig.clientSecret,
                },
                {
                    key: oidpSettingsKeys.clientUsername,
                    value: inputOIDPConfig.clientUsername
                },
                {
                    key: oidpSettingsKeys.realmUrl,
                    value: inputOIDPConfig.clientURL
                }
            ])
            return {
                success: true,
                message: 'OIDP config sucessfully saved'
            }
        }
        return {
            success: false,
            message: 'OIDP config not saved'
        }
    }

    async testOIDPconfig(inputOIDPConfig: PutOIDPConfig): Promise<ResponseOIDPConfig> {
        logger.debug('Testing new OIDP settings...')
        const currentDecrypted = await this.getDecryptedOIDPConfig()
        const urlWithSlash = inputOIDPConfig.clientURL.endsWith('/') ? inputOIDPConfig.clientURL : inputOIDPConfig.clientURL + '/'
        inputOIDPConfig.clientURL = urlWithSlash
        if (currentDecrypted) {
            const parsedCurrentDecrypted = oIDPConfigSchema.parse(currentDecrypted)
            logger.debug('Comparing new OIDP settings and saved at DB...')
            const isEqual = deepEqual(inputOIDPConfig, parsedCurrentDecrypted)
            logger.silly(`inputOIDPConfig: ${JSON.stringify(inputOIDPConfig)}`)
            if (isEqual) {
                throw (new ErrorApp('validate', 'Settings are equal and not changed'))
            }
            logger.debug('Settings are not equal')
        }
        const requestBody: RequestAccessTokenByPasswordSchema = {
            client_id: inputOIDPConfig.clientId,
            username: inputOIDPConfig.clientUsername,
            password: inputOIDPConfig.clientPassword,
            grant_type: 'password',
            client_secret: inputOIDPConfig.clientSecret,
        }

        logger.debug('Fetching new access token...')
        this.oidpService = OIDPService.getInstance()
        try {
            const data = await this.oidpService.fetchAcessTokenByPassword(inputOIDPConfig.clientURL, requestBody)
            if (data.access_token) {
                return { success: true }
            }
        }
        catch (e) {
            if (e instanceof AxiosError) {
                throw new ErrorApp('validation', `Test authenticate to ${inputOIDPConfig.clientURL} error: ${e.message}`)
            }
            throw e
        }
        return { success: false }
    }

    async getDecryptedOIDPConfig(): Promise<OIDPConfigService | undefined> {
        try {
            const configUrl = (await this.configService.getDecryptedConfig(oidpSettingsKeys.realmUrl)).value
            const parsedZod = z.string().url().parse(configUrl)
            const urlWithSlash = parsedZod.endsWith('/') ? parsedZod : parsedZod + '/'
            const config: OIDPConfigService = {
                clientId: (await this.configService.getDecryptedConfig(oidpSettingsKeys.clientId)).value,
                clientSecret: (await this.configService.getDecryptedConfig(oidpSettingsKeys.clientSecret)).value,
                clientUsername: (await this.configService.getDecryptedConfig(oidpSettingsKeys.clientUsername)).value,
                clientPassword: (await this.configService.getDecryptedConfig(oidpSettingsKeys.clientPassword)).value,
                clientURL: urlWithSlash
            }
            return config
        } catch (e) {
            if (e instanceof Error)
                logger.warn(`ConfigService getOIDPConfig: ${e.message}`)
            return undefined
        }
    }
}

export default ConfigOIDPService