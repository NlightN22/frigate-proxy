import { z } from "zod";
import { OIDPConfigService } from "../../oidp/oidp.schema";
import ConfigService from "../config.service";
import { PutOIDPConfig, putOIDPConfig } from "./config.oidp.schema";
import { oidpSettingsKeys } from "./oidp.settings";
import { logger } from "../../../utils/logger";

class ConfigOIDPService {


    configService = ConfigService.getInstance()

    async testOIDPconfig (inputOIDPConfig: PutOIDPConfig) {
        
        // check equals with current settings
        // if equals - return Error
        // if not equals:
            // fetchAccessToken
            // verify accessToken
            // try fetchRoles
            // return fetchResult

    }

    saveOIDPconfig (inputOIDPConfig: PutOIDPConfig) {
        // test config
        // if test OK - save

    }

    async getDecryptedOIDPConfig (): Promise<OIDPConfigService | undefined> {
        try{
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