import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { encryptionKey } from "../../consts";
import { logger } from "../../utils/logger";
import prisma from "../../utils/prisma";
import { ErrorApp } from "../hooks/error.handler";
import { allSettings } from "./all.settings";
import { appSettingsKeys } from "./app.settings";
import { PutConfigsSchema, ResponseConfigsSchema } from "./config.schema";

export interface Setting {
    description: string,
    encrypted: boolean,
    validateFn?: (value: any) => boolean | Promise<boolean>
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
        if (setting.validateFn) {
            const result = await setting.validateFn(value)
            if (!result) throw new ErrorApp('validate', `ConfigService. Settings with ${key}, not validated`)
        }
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
    async getEncryptedConfig(key: string) {
        return await this.prismaClient.findUnique({
            where: { key: key }
        })
    }

    async getDecryptedConfig(key: string) {
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

    async getAllEncryptedConfig(): Promise<ResponseConfigsSchema> {
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
            const adminRole = await this.getDecryptedConfig(appSettingsKeys.adminRole)
            return adminRole
        } catch {
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