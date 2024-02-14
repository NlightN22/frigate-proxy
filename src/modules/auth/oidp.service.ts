import axios from "axios"
import { OIDP } from "../../consts"
import { logger } from "../../utils/logger"
import { OIDPUrls } from "./oidp.urls"
import { OIDPRole, AuthUser } from "./oidp.schema"
import { UUID, randomUUID } from "crypto"

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

export class OIDPService {
    id: UUID
    private static _authenticate: Authenticate | null
    private static _authState: OIDPAuthState = OIDPAuthState.NotStarted
    static get authState(): OIDPAuthState {
        return this._authState
    }

    private static _refreshTokenTimeout?: NodeJS.Timeout;

    constructor() {
        this.id = randomUUID()
        this.init()
    }

    private async init() {
        await this.fetchAccessToken()
        this.setRefreshTokenTimeout()
    }

    private async fetcher(authURL: string) {
        if (!OIDPService._authenticate) throw Error('Authentication not completed')
        const url = OIDP.url.protocol + '//' + OIDP.url.host + authURL
        try {
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${OIDPService._authenticate.access_token}` },
                timeout: 40000,
            })
            return response.data
        } catch (e) {
            logger.error(e)
            return null
        }
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

    private async fetchAccessToken() {
        if (OIDPService._authState === OIDPAuthState.InProgress) return
        OIDPService._authState = OIDPAuthState.InProgress
        logger.debug('AuthService fetchAccessToken...')
        const url = OIDP.url.toString() + OIDPUrls.auth
        const request = {
            client_id: OIDP.clientID,
            username: OIDP.userName,
            password: OIDP.userPass,
            grant_type: 'password',
            client_secret: OIDP.clientSecret,
        }
        const reqXHTML = new URLSearchParams(request).toString()
        try {
            const response = await axios.post(url, reqXHTML, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            OIDPService._authenticate = response.data;
            logger.debug('AuthService set access token')
        } catch (error) {
            logger.error(error);
            OIDPService._authenticate = null;
        } finally {
            OIDPService._authState = OIDPAuthState.Completed
        }
    }

    private setRefreshTokenTimeout() {
        if (OIDPService._authenticate && OIDPService._authenticate.expires_in) {
            const expiresInMs = (OIDPService._authenticate.expires_in - 30) * 1000;
            OIDPService._refreshTokenTimeout = setTimeout(() => {
                this.init();
            }, expiresInMs);
        }
    }

    async refreshToken(): Promise<void> {
        await this.fetchAccessToken();
    }
}