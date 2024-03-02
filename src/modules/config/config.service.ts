import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { encryptionKey } from "../../consts";
import { AppSetting, appSettingsKeys } from "./app.settings";
import prisma from "../../utils/prisma";
import { PutConfigSchema, PutConfigsSchema, ResponseConfigsSchema } from "./config.shema";
import { oIDPSettings, oidpSettingsKeys } from "./oidp.settings";
import { logger } from "../../utils/logger";
import { ErrorApp } from "../hooks/error.handler";
import { allSettings } from "./all.settings";
import { OIDPConfig } from "../oidp/oidp.service";

export interface Setting {
    description: string,
    encrypted: boolean,
}

export type MapSettings = [string, Setting][]

class ConfigService {
    private static _instance: ConfigService
    prismaClient = prisma.appSettings

    private constructor() {
        logger.debug(`ConfigService initialized`)
    }

    public static getInstance() {
        if (!ConfigService._instance) {
            ConfigService._instance = new ConfigService()
        }
        return ConfigService._instance
    }

    async saveConfig(key: string, value: string) {
        const allMapSettings: Map<string, Setting> = this.getMapSettings()
        const setting = allMapSettings.get(key)
        if (!setting) throw new ErrorApp('validate', `ConfigService. Settings with ${key}, does not exist`)
        // check equals at prisma
        const settingDB = await this.prismaClient.findUnique({
            where: { key: key }
        })
        if (settingDB && settingDB.value === value) return settingDB
        const finalValue = setting.encrypted ? await this.encrypt(value) : value
        return await this.prismaClient.upsert({
            where: { key: key },
            update: {
                value: finalValue,
                encrypted: setting.encrypted,
                description: setting.description
            },
            create: {
                key: key,
                encrypted: setting.encrypted,
                value: finalValue,
                description: setting.description
            }
        })
    }

    async saveConfigs(configs: PutConfigsSchema) {
        const results = await Promise.all(configs.map(conf => this.saveConfig(conf.key, conf.value)))
        return results
    }
    async getConfig(key: string) {
        return await this.prismaClient.findUnique({
            where: { key: key }
        })
    }

    async getEncryptedConfig(key: string) {
        let config = await this.prismaClient.findUniqueOrThrow({ where: { key: key } })
        const { value, ...rest } = config
        if (!value) throw new ErrorApp('validate', `ConfigService. Key ${key} value does not exist`)
        if (config.encrypted) {
            const decryptedValue = await this.decrypt(value)
            config = { value: decryptedValue, ...rest }
            if (!config.value) throw new ErrorApp('validate', `ConfigService. Key ${key} error at value decryption`)
        }
        logger.silly(`ConfigService. Get config key ${config.key}`)
        return config
    }

    async getAllConfig(): Promise<ResponseConfigsSchema> {
        const dbConfig = await this.prismaClient.findMany()
        const allMapSettings: Map<string, Setting> = this.getMapSettings()
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

    async getAdminRole() {
        try {
            const adminRole = await this.getEncryptedConfig(appSettingsKeys.adminRole)
            return adminRole
        } catch {
            return undefined
        }
    }

    async getOIDPConfig(): Promise<OIDPConfig | undefined> {
        try{
            const config: OIDPConfig = {
                clientId: (await this.getEncryptedConfig(oidpSettingsKeys.clientId)).value,
                clientSecret: (await this.getEncryptedConfig(oidpSettingsKeys.clientSecret)).value,
                clientUsername: (await this.getEncryptedConfig(oidpSettingsKeys.clientUsername)).value,
                clientPassword: (await this.getEncryptedConfig(oidpSettingsKeys.clientPassword)).value,
                clientURL: (await this.getEncryptedConfig(oidpSettingsKeys.realmUrl)).value,
            }
            return config
        } catch{
            return undefined
        }
    }

    getMapSettings(): Map<string, Setting> {
        return new Map<string, Setting>(allSettings)
    }

    private async decrypt(encryptedText: string) {
        const [ivHex, encryptedDataHex] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedData = Buffer.from(encryptedDataHex, 'hex');
        const key = (await promisify(scrypt)(encryptionKey!, 'salt', 32)) as Buffer;
        const decipher = createDecipheriv('aes-256-ctr', key, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
        return decrypted.toString();
    }

    private async encrypt(text: string) {
        const key = (await promisify(scrypt)(encryptionKey!, 'salt', 32)) as Buffer;
        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-ctr', key, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

}

export default ConfigService