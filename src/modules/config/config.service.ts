import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { encryptionKey } from "../../consts";
import { AppSetting } from "./config.settings";
import prisma from "../../utils/prisma";
import { PutConfigSchema } from "./config.shema";
import { oIDPSettings } from "./oidp.settings";
import { logger } from "../../utils/logger";
import { ErrorApp } from "../hooks/error.handler";

interface Setting {
    name: string,
    key: string,
    value?: string,
}

type ConfigObject<T> = {
    [K in keyof T]: Setting;
};

class ConfigService {
    prismaClient = prisma.appSettings

    constructor() {
        logger.debug(`ConfigService initialized`)
    }

    async saveConfig(config: PutConfigSchema) {
        const { value, ...withKey } = config
        const finalValue = config.encrypted ? await this.encrypt(config.value) : config.value
        const { key, ...rest } = withKey
        return await this.prismaClient.upsert({
            where: { key: config.key },
            update: { value: finalValue, ...rest },
            create: { ...withKey, value: finalValue }
        })
    }
    async getConfig(key: string) {
        return await this.prismaClient.findUnique({
            where: { key: key }
        })
    }

    async getEncryptedConfig(key: string) {
        let config = await this.prismaClient.findUniqueOrThrow({ where: { key: key } })
        const { value, ...rest } = config
        if (!value) throw new ErrorApp('validate', `Key ${key} value does not exist`)
        if (config.encrypted) {
            config = { value: await this.decrypt(value), ...rest }
            if (!config.value) throw new ErrorApp('validate', `Key ${key} error at value decryption`)
        }
        logger.debug(`Get config key ${key}`)
        return config
    }

    async getAllConfig() {
        return await this.prismaClient.findMany()
    }

    async getSettings() {
        const settings = [
            ...this.mapSettings(oIDPSettings),
            ...this.mapSettings(AppSetting)
        ]
        return settings
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

    private mapSettings<T>(obj: ConfigObject<T>): Setting[] {
        return Object.keys(obj).map((key) => {
            const item = obj[key];
            return {
                name: item.name,
                key: item.key,
            };
        });
    }

}

export default ConfigService