import { z } from "zod";
import { deepEqual } from "../../../utils/deep.equal";
import { logger } from "../../../utils/logger";
import { ErrorApp } from "../../hooks/error.handler";
import { OIDPConfigService, RequestAccessTokenByPasswordSchema } from "../../oidp/oidp.schema";
import ConfigService from "../config.service";
import { PutOIDPConfig, putOIDPConfig } from "./config.oidp.schema";
import { oIDPSettings, oidpSettingsKeys } from "./oidp.settings";
import OIDPService from "../../oidp/oidp.service";
import { AxiosError } from "axios";
import prisma from "../../../utils/prisma";
import { ResponseConfigsSchema, Setting } from "../config.schema";

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
    async saveOIDPconfig(inputOIDPConfig: PutOIDPConfig) {
        const result = await this.testOIDPconfig(inputOIDPConfig)
        if (result) {
            return await this.configService.saveConfigs([
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

        }
        throw new ErrorApp('internal', 'Not get result from OIDP settings test')
    }

    async testOIDPconfig(inputOIDPConfig: PutOIDPConfig): Promise<boolean> {
        logger.debug('Testing new OIDP settings...')
        const currentDecrypted = await this.getDecryptedOIDPConfig()
        const urlWithSlash = inputOIDPConfig.clientURL.endsWith('/') ? inputOIDPConfig.clientURL : inputOIDPConfig.clientURL + '/'
        inputOIDPConfig.clientURL = urlWithSlash
        if (currentDecrypted) {
            const parsedCurrentDecrypted = putOIDPConfig.parse(currentDecrypted)
            logger.debug('Comparing new OIDP settings and saved at DB...')
            const isEqual = deepEqual(inputOIDPConfig, parsedCurrentDecrypted)
            logger.silly(`inputOIDPConfig: ${JSON.stringify(inputOIDPConfig)}`)
            // logger.debug(`parsedCurrentDecrypted: ${JSON.stringify(parsedCurrentDecrypted)}`)
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
                return true
            }
        }
        catch (e) {
            if (e instanceof AxiosError) {
                throw new ErrorApp('validation', `Test authenticate to ${inputOIDPConfig.clientURL} error: ${e.message}`)
            }
            throw e
        }
        return false
    }

    async getAllEncryptedConfig(): Promise<ResponseConfigsSchema> {
        const dbConfig = await this.prismaClient.findMany()
        const allMapSettings = new Map<string, Setting>(oIDPSettings)
        const responseConfigs: ResponseConfigsSchema = Array.from(allMapSettings).map(([key, setting]) => {
            const dbItem = dbConfig.find(item => item.key === key);
            return {
                key,
                value: dbItem ? dbItem.value : '',
                description: dbItem?.description ?? setting.description,
                encrypted: setting.encrypted
            }
        })
        return responseConfigs
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