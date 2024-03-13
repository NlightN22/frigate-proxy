import { FastifyReply, FastifyRequest } from "fastify"
import * as jwt from 'jsonwebtoken'
import jwksRsa from "jwks-rsa"
import { logger } from "../../utils/logger"
import ConfigService from "../config/config.service"
import { OIDPUrls } from "../oidp/oidp.urls"
import { ErrorApp } from "./error.handler"
import { TokenUser } from "./token.shchema"

const configService = ConfigService.getInstance()

const getUrl = async () => {
    const oidpConfig = await configService.getOIDPConfig()
    return oidpConfig?.clientURL
}

let jwksClientPromise

async function getJwksClient() {
    if (!jwksClientPromise) {
        const url = await getUrl()
        if (!url) {
            logger.warn(`validateJwt Cannot get URL from config when init JwksClient`)
            throw new Error('validateJwt JWKS client URL is not configured.')
        }
        const certUrl = `${url}${OIDPUrls.certs}`
        logger.debug(`validateJwt initializeJwksClient ${certUrl}`)
        jwksClientPromise = jwksRsa({
            jwksUri: certUrl
        })
    }
    return jwksClientPromise
}

function getKey(header, callback) {
    getJwksClient().then(jwksClient => {
    jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err, null)
            return
        }
        if (!key) {
            callback(new ErrorApp('internal', 'validateJwt key does not exists'))
            return
        }
        let signingKey = 'rsaPublicKey' in key ? key.rsaPublicKey : key.getPublicKey ? key.getPublicKey() : null
        if (!signingKey) {
            callback(new ErrorApp('internal', 'validateJwt Unable to find a signing key.'), null)
            return
        }
        // logger.debug(`signingKey: ${JSON.stringify(signingKey)}`)
        callback(null, signingKey)
    })}).catch(err => {
        callback(new ErrorApp('internal', `validateJwt JWKS client initialization error:${err.message}`), null)
    })
}

export async function testJwksClientInitialization(newUrl) {
    try {
        const testClient = jwksRsa({
            jwksUri: `${newUrl}${OIDPUrls.certs}`
        })
        const keys = await testClient.getSigningKeys()
        if (!keys || keys.length === 0) {
            throw new Error('No signing keys found')
        }
        logger.info('validateJwt New JWKS client URL is valid and accessible.')
        return true
    } catch (error) {
        logger.error(`validateJwt Error testing new JWKS client URL: ${error.message}`)
        return false
    }
}

export async function validateJwt(request: FastifyRequest, reply: FastifyReply) {
    const url = await getUrl()
    if (!url) {
        logger.warn(`validateJwt Cannot read OIDP url from config. Pass`)
        return
    }
    const token = request.headers.authorization?.split(' ')[1]
    if (!token) {
        reply.code(401).send({ error: 'validateJwt No token provided.' })
        return
    }

    // logger.debug(`token: ${JSON.stringify(token)}`)
    try {
        const decoded: TokenUser = await new Promise((resolve, reject) => {
            jwt.verify(token, getKey, {
                issuer: [url.toString(), url.toString().replace(/\/$/, "")],
                algorithms: ['RS256']
            }, (err, decoded) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(decoded as TokenUser)
                }
            })
        })

        if (!decoded) {
            throw new Error('validateJwt decoded token does not exists')
        }

        // logger.debug(`decoded: ${JSON.stringify(decoded)}`)
        request.user = {
            id: decoded.sub,
            name: decoded.name,
            roles: decoded.realm_access.roles
        }
    } catch (e) {
        const url = await getUrl()
        if (e instanceof Error) {
            logger.error(`validateJwt ${url} ${e.message}`)
        }
        reply.code(401).send({ error: 'validateJwt Unauthorized: Invalid token.' })
    }
}

