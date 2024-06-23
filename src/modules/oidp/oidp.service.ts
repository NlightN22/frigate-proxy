import axios, { AxiosError } from "axios"
import { UUID } from "crypto"
import { JwtPayload, jwtDecode } from "jwt-decode"
import { z } from "zod"
import { logger } from "../../utils/logger"
import prisma from "../../utils/prisma"
import { sleep } from "../../utils/sleep"
import ConfigOIDPService from "../config/oidp/config.oidp.service"
import { ErrorApp } from "../hooks/error.handler"
import { AuthUser, OIDPRole, RequestAccessTokenByPasswordSchema, RequestAccessTokenByRefreshSchema, UserByRole } from "./oidp.schema"
import { OIDPUrls } from "./oidp.urls"

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

class OIDPService {
    private static instance: OIDPService
    private configOIDPService = ConfigOIDPService.getInstance()
    id: UUID
    private static _authenticate: Authenticate | null
    private static _authState: OIDPAuthState = OIDPAuthState.NotStarted
    static get authState(): OIDPAuthState {
        return this._authState
    }

    private prismaClient = prisma.oIDPsession

    private static _refreshTokenTimeout?: NodeJS.Timeout;

    private constructor() {
        this.init()
        logger.debug(`OIDPService initialized`)
    }

    public static getInstance(): OIDPService {
        if (!OIDPService.instance) {
            OIDPService.instance = new OIDPService()
        }
        return OIDPService.instance
    }

    async fetchRoles(accessToken?: string, clientURL?: string) {
        const data: OIDPRole[] = await this.fetcher(OIDPUrls.roles, accessToken, clientURL)
        return data
    }

    async fetchUsers(accessToken?: string, clientURL?: string) {
        const data: AuthUser[] = await this.fetcher(OIDPUrls.users, accessToken, clientURL)
        return data
    }

    async fetchUsersByRole(roleName: string, accessToken?: string, clientURL?: string) {
        logger.debug(`OIDPService fetch uses by role: ${roleName}`)
        const data: UserByRole[] = await this.fetcher(OIDPUrls.usersByRole(roleName), accessToken, clientURL)
        return data
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
                const authData = await this.getNewAuthenticateData()
                this.setNewAuthenticateData(authData)
            }
        } catch (e) {
            logger.error(`ERROR! OIDPService not started: ${e.message}`)
        }
    }

    private async getNewAuthenticateData(): Promise<Authenticate> {
        let data: Authenticate | undefined
        while (!data) {
            const refreshToken = OIDPService._authenticate?.refresh_token
            if (refreshToken && this.verifyJWT(refreshToken)) data = await this.jobFetchAccessToken(refreshToken)
            else data = await this.jobFetchAccessToken()
            if (!data) logger.debug('OIDPService not get authentificate data')
            await sleep(30 * 1000) // wait 30 seconds
        }
        return data
    }

    async setNewAuthenticateData(data: Authenticate) {
        OIDPService._authenticate = data
        this.saveTokenToDb(data)
        this.setRefreshTokenTimeout()
        OIDPService._authState = OIDPAuthState.Completed
        logger.debug('OIDPService set access token')
    }

    private async getRequestConfig() {
        const config = await this.configOIDPService.getDecryptedOIDPConfig()
        if (!config) logger.warn(`OIDPService cannot set request config: ${config}`)
        return config
    }

    private async jobFetchAccessToken(refreshToken?: string) {
        if (OIDPService._authState === OIDPAuthState.InProgress) return
        OIDPService._authState = OIDPAuthState.InProgress
        const requestConfig = await this.getRequestConfig()
        if (!requestConfig) {
            OIDPService._authState = OIDPAuthState.NotStarted
            return
        }
        logger.debug('OIDPService fetchAccessToken...')
        try {
            let response: Authenticate
            if (refreshToken) {
                const requestBody: RequestAccessTokenByRefreshSchema = {
                    client_id: requestConfig.clientId,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                    client_secret: requestConfig.clientSecret,
                }
                response = await this.fetchAcessTokenByRefreshToken(requestConfig.clientURL, requestBody)
            }
            const requestBody: RequestAccessTokenByPasswordSchema = {
                client_id: requestConfig.clientId,
                username: requestConfig.clientUsername,
                password: requestConfig.clientPassword,
                grant_type: 'password',
                client_secret: requestConfig.clientSecret,
            }
            response = await this.fetchAcessTokenByPassword(requestConfig.clientURL, requestBody)
            return this.mapToAuthenticate(response)
        } catch (e) {
            if (e instanceof Error) {
                logger.error(`OIDPService fetch access token: ${e.message}`)
                if (e instanceof AxiosError) {
                    logger.error(`OIDPService fetch access url: ${requestConfig.clientURL}`)
                    logger.error(`OIDPService fetch access client_id: ${requestConfig.clientId}`)
                    logger.error(`OIDPService fetch access response: ${e.response?.data}`)
                }
            }
            OIDPService._authState = OIDPAuthState.NotStarted
            return undefined
        }
    }

    async fetchAcessTokenByPassword(clientURL: string, reqBody: RequestAccessTokenByPasswordSchema) {
        logger.debug('OIDPService fetch by password...')
        const reqXHTML = new URLSearchParams(reqBody).toString()
        return this.fetchAccessToken(clientURL, reqXHTML)
    }

    async fetchAcessTokenByRefreshToken(clientURL: string, reqBody: RequestAccessTokenByRefreshSchema) {
        logger.debug('OIDPService fetch by refresh token...')
        const reqXHTML = new URLSearchParams(reqBody).toString()
        return this.fetchAccessToken(clientURL, reqXHTML)
    }

    private async fetchAccessToken(clientURL: string, reqXHTML: string) {
        const url = clientURL + OIDPUrls.auth
        const { data, status } = await axios.post<Authenticate>(url, reqXHTML, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        return data
    }

    private async getTokenAtDb() {
        return await this.prismaClient.findFirst({
            where: { id: 1 }
        })
    }

    private async saveTokenToDb(auth: Authenticate) {
        logger.debug('OIDPService save access token to DB')
        await this.prismaClient.upsert({
            where: { id: 1 },
            update: auth,
            create: { id: 1, ...auth }
        })
        OIDPService._authenticate = auth;
    }

    private setRefreshTokenTimeout() {
        if (!OIDPService._authenticate || !OIDPService._authenticate.access_token) {
            logger.error('OIDPService can not set refresh token timeout, OIDPService not authenticated')
            return
        }
        const expired = this.getTokenExp(OIDPService._authenticate.access_token)
        if (!expired) throw new ErrorApp('runtime', 'OIDPService cannot get token expired time')
        const currentTimeInSeconds = Math.floor(Date.now() / 1000)
        const timeUntilExpirationInSeconds = expired - currentTimeInSeconds - 30
        if (timeUntilExpirationInSeconds > 0) {
            const expiresInMs = timeUntilExpirationInSeconds * 1000
            logger.debug(`OIDPService set expired token time to ${timeUntilExpirationInSeconds} sec`)
            OIDPService._refreshTokenTimeout = setTimeout(async () => {
                logger.debug(`OIDPService access token expired. Start update token.`)
                const authData = await this.getNewAuthenticateData()
                this.setNewAuthenticateData(authData)
            }, expiresInMs);
        }
    }

    private async fetcherTokenPrehandler() {
        if (!OIDPService._authenticate || !OIDPService._authenticate.access_token) throw Error(`OIDPService Authentication not completed, auth state ${OIDPService.authState}`)
        let accessToken = OIDPService._authenticate.access_token
        if (accessToken) {
            if (!this.verifyJWT(accessToken)) {
                logger.debug('OIDPService.fetcher acess token not valid')
                const authData = await this.getNewAuthenticateData()
                this.setNewAuthenticateData(authData)
            }
        }
        if (!accessToken || !this.verifyJWT(accessToken)) throw new ErrorApp('internal', 'OIDPService acess token not valid')
        return accessToken
    }

    private async fetcher(path: string, accessToken?: string, clientURL?: string) {
        if (!accessToken) accessToken = await this.fetcherTokenPrehandler()
        if (!clientURL) {
            const requestConfig = await this.getRequestConfig()
            if (!requestConfig) throw Error(`OIDPService config not set`)
            clientURL = requestConfig.clientURL
        }
        const parsedUrl = z.string().url().parse(clientURL)
        const oidpURL = new URL(parsedUrl)
        const url = oidpURL.protocol + '//' + oidpURL.host + '/' + path
        try {
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: 70000,
            })
            return response.data
        } catch (e) {
            if (e instanceof Error) {
                logger.error(`OIDPService: ${e.message}`)
                if (e instanceof AxiosError) {
                    logger.error(`OIDPService fetch access url: ${url}`)
                    logger.error(`OIDPService fetch access response: ${e.response?.data}`)
                }
            }
            return null
        }
    }

    verifyJWT(token: string) {
        try {
            const decoded = jwtDecode<JwtPayload>(token)
            if (decoded && decoded.exp) return this.isTokenExpired(decoded.exp)
            return false
        } catch (e) {
            logger.error(`OIDPService ${e.message}`)
            return false
        }
    }

    private getTokenExp(token: string) {
        try {
            const decoded = jwtDecode<JwtPayload>(token)
            return decoded.exp
        } catch (e) {
            logger.error(`OIDPService ${e.message}`)
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