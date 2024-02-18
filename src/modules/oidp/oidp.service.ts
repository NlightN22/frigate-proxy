import axios, { AxiosResponse } from "axios"
import { logger } from "../../utils/logger"
import { OIDPUrls } from "./oidp.urls"
import { OIDPRole, AuthUser } from "./oidp.schema"
import { UUID, randomUUID } from "crypto"
import prisma from "../../utils/prisma"
import { JwtPayload, jwtDecode } from "jwt-decode"
import { sleep } from "../../utils/sleep"
import { ErrorApp } from "../hooks/error.handler"
import { oidpSettingsKeys } from "../config/oidp.settings"
import ConfigService from "../config/config.service"

type Authenticate = {
    access_token: string
    expires_in: number
    refresh_expires_in: number
    refresh_token: string
    token_type: string
}

export enum OIDPAuthState {
    NotStarted,
    InProgress,
    Completed,
}

interface OIDPConfig {
    clientId: string,
    clientSecret: string,
    clientUsername: string,
    clientPassword: string,
    clientURL: string,
}

class OIDPService {
    configService = new ConfigService()
    id: UUID
    private static _authenticate: Authenticate | null
    private static _oidpConfig: OIDPConfig | undefined
    private static _authState: OIDPAuthState = OIDPAuthState.NotStarted
    static get authState(): OIDPAuthState {
        return this._authState
    }

    private prismaClient = prisma.oIDPsession

    private static _refreshTokenTimeout?: NodeJS.Timeout;

    constructor() {
        this.init()
        logger.debug(`OIDPService initialized`)
    }

    async fetchRoles() {
        const data: OIDPRole[] = await this.fetcher(OIDPUrls.roles)
        return data
    }

    async fetchUsers() {
        const data: AuthUser[] = await this.fetcher(OIDPUrls.users)
        return data
    }

    async fetchUsersByRole(roleName: string) {
        const data: AuthUser[] = await this.fetcher(OIDPUrls.usersByRole(roleName))
        return data
    }

    async refreshToken(): Promise<void> {
        await this.fetchAccessToken();
    }

    private async init() {
        try {
            const authDb = await this.getTokenAtDb()
            let tokenState: boolean = false
            let refreshState: boolean = false
            if (authDb) {
                logger.debug("OIDPService get token from DB...")
                tokenState = this.verifyJWT(authDb.access_token)
                refreshState = this.verifyJWT(authDb.refresh_token)
            }
            if (authDb && tokenState) {
                logger.debug("OIDPService DB token is actual")
                const { id, ...rest } = authDb
                OIDPService._authenticate = rest
                OIDPService._authState = OIDPAuthState.Completed
                this.setRefreshTokenTimeout()
            } else {
                logger.debug("OIDPService get new token...")
                this.getNewToken()
            }
        } catch (e) {
            logger.error(`ERROR! OIDPService not started: ${e.message}`)
        }
    }

    private async getConfig() {
        const config: OIDPConfig = {
            clientId: (await this.configService.getEncryptedConfig(oidpSettingsKeys.clientId)).value,
            clientSecret: (await this.configService.getEncryptedConfig(oidpSettingsKeys.clientSecret)).value,
            clientUsername: (await this.configService.getEncryptedConfig(oidpSettingsKeys.clientUsername)).value,
            clientPassword: (await this.configService.getEncryptedConfig(oidpSettingsKeys.clientPassword)).value,
            clientURL: (await this.configService.getEncryptedConfig(oidpSettingsKeys.realmUrl)).value,
        }
        return config
    }

    private async getNewToken() {
        const refreshToken = OIDPService._authenticate?.refresh_token
        let data: Authenticate | undefined
        while (!data) {
            if (refreshToken && this.verifyJWT(refreshToken)) data = await this.fetchAccessToken(refreshToken)
            else data = await this.fetchAccessToken()
            await sleep(30000)
        }
        this.saveTokenToDb(data)
        this.setRefreshTokenTimeout()
        logger.debug('OIDPService set access token')
        OIDPService._authState = OIDPAuthState.Completed
    }

    private setRequestBody(refreshToken: string | undefined = undefined) {
        if (!OIDPService._oidpConfig) return
        let request
        if (refreshToken) {
            request = {
                client_id: OIDPService._oidpConfig.clientId,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
                client_secret: OIDPService._oidpConfig.clientSecret,
            }
        } else {
            request = {
                client_id: OIDPService._oidpConfig.clientId,
                username: OIDPService._oidpConfig.clientUsername,
                password: OIDPService._oidpConfig.clientPassword,
                grant_type: 'password',
                client_secret: OIDPService._oidpConfig.clientSecret,
            }
        }
        return new URLSearchParams(request).toString()
    }

    private async setRequestConfig() {
        try {
            const config = await this.getConfig()
            OIDPService._oidpConfig = config
            logger.info(`OIDPService set request config`)
        } catch (e) {
            logger.error(`OIDPService cannot set request config: ${e.message}`)
        }
    }

    private async fetchAccessToken(refreshToken: string | undefined = undefined) {
        if (OIDPService._authState === OIDPAuthState.InProgress) return
        OIDPService._authState = OIDPAuthState.InProgress
        if (!OIDPService._oidpConfig) {
            await this.setRequestConfig()
            if (!OIDPService._oidpConfig) {
                OIDPService._authState = OIDPAuthState.NotStarted
                return
            }
        }
        logger.debug('OIDPService fetchAccessToken...')
        const url = OIDPService._oidpConfig.clientURL + OIDPUrls.auth
        const reqXHTML = this.setRequestBody(refreshToken)
        if (!reqXHTML) {
            logger.error(`OIDPService cannot set request reqXHTML`)
            OIDPService._authState = OIDPAuthState.NotStarted
            return
        }
        try {
            if (refreshToken) logger.debug('OIDPService fetch by refresh token...')
            const { data, status } = await axios.post<Authenticate>(url, reqXHTML, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return this.mapToAuthenticate(data)
        } catch (error) {
            logger.error(error);
            OIDPService._authState = OIDPAuthState.NotStarted
            return undefined
        }
    }

    private async getTokenAtDb() {
        return await this.prismaClient.findFirst({
            where: { id: 1 }
        })
    }

    private async saveTokenToDb(auth: Authenticate) {
        await this.prismaClient.upsert({
            where: { id: 1 },
            update: auth,
            create: { id: 1, ...auth }
        })
        OIDPService._authenticate = auth;
    }

    private setRefreshTokenTimeout() {
        if (OIDPService._authenticate && OIDPService._authenticate.access_token) {
            const expired = this.getTokenExp(OIDPService._authenticate.access_token)
            if (!expired) throw new ErrorApp('runtime', 'OIDPService cannot get token expired time')
            const currentTimeInSeconds = Math.floor(Date.now() / 1000)
            const timeUntilExpirationInSeconds = expired - currentTimeInSeconds - 30
            if (timeUntilExpirationInSeconds > 0) {
                const expiresInMs = timeUntilExpirationInSeconds * 1000
                logger.debug(`OIDPService set expired token time to ${timeUntilExpirationInSeconds} sec`)
                OIDPService._refreshTokenTimeout = setTimeout(() => {
                    logger.debug(`OIDPService access token expired. Start update token.`)
                    this.getNewToken()
                }, expiresInMs);
            }
        }
    }

    private async fetcher(authURL: string) {
        const getNewTokenConditions = OIDPService.authState === OIDPAuthState.NotStarted ||
            (OIDPService.authState === OIDPAuthState.Completed && !OIDPService._authenticate) ||
            !OIDPService._oidpConfig

        if (getNewTokenConditions) await this.getNewToken()
        if (!OIDPService._authenticate) throw Error(`Authentication not completed, auth state ${OIDPService.authState}`)
        if (!OIDPService._oidpConfig) throw Error(`OIDPService config not set`)
        const oidpURL = new URL(OIDPService._oidpConfig.clientURL)
        const url = oidpURL.protocol + '//' + oidpURL.host + authURL
        try {
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${OIDPService._authenticate.access_token}` },
                timeout: 70000,
            })
            return response.data
        } catch (e) {
            logger.error(e)
            return null
        }
    }

    verifyJWT(token: string) {
        try {
            const decoded = jwtDecode<JwtPayload>(token)
            if (decoded && decoded.exp) return this.isTokenExpired(decoded.exp)
            return false
        } catch (e) {
            logger.error(e.message)
            return false
        }
    }

    private getTokenExp(token: string) {
        try {
            const decoded = jwtDecode<JwtPayload>(token)
            return decoded.exp
        } catch (e) {
            logger.error(e.message)
            return undefined
        }
    }

    private isTokenExpired(exp: number) {
        return (Date.now() < exp * 1000)
    }

    private getJWTRoles(token: string) {
        const decoded = jwtDecode<any>(token)
        return decoded ? decoded.realm_access.roles : []
    }

    private mapToAuthenticate(input: any): Authenticate {
        return {
            access_token: input.access_token,
            expires_in: input.expires_in,
            refresh_expires_in: input.refresh_expires_in,
            refresh_token: input.refresh_token,
            token_type: input.token_type
        };
    }
}

export default OIDPService