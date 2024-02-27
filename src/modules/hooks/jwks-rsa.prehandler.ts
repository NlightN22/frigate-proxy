import { FastifyReply, FastifyRequest } from "fastify";
import jwksRsa from "jwks-rsa";
import * as jwt from 'jsonwebtoken'
import { TokenUser } from "./token.shchema";
import { oidpSettingsKeys } from "../config/oidp.settings";
import { ErrorApp } from "./error.handler";
import { logger } from "../../utils/logger";
import ConfigService from "../config/config.service";

const getOidpUrl = async () => {
    try {
        const configService = ConfigService.getInstance()
        const config = await configService.getEncryptedConfig(oidpSettingsKeys.realmUrl)
        return new URL(config.value)
    } catch {
        return undefined
    }
}

async function initializeJwksClient() {
    const url = await getOidpUrl()
    if (!url) {
        logger.warn(`Can not get URL from config when init JwksClient`)
        return
    }
    const client = jwksRsa({
        jwksUri: `${url.toString()}/protocol/openid-connect/certs`
    })
    return client;
}


let jwksClient: jwksRsa.JwksClient | undefined;
initializeJwksClient().then(client => {
    jwksClient = client;
});

function getKey(header, callback) {
    if (!jwksClient) {
        initializeJwksClient().then( client => {
            jwksClient = client
        })
        if (!jwksClient){
            callback(new ErrorApp('internal', 'JWKS client not initialized'));
            return;
        }
    }
    jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err, null);
            return;
        }
        if (!key) throw callback(new ErrorApp('internal', 'key does not exists'))
        let signingKey;
        if ('rsaPublicKey' in key) {
            signingKey = key.rsaPublicKey;
        } else if ('getPublicKey' in key) {
            signingKey = key.getPublicKey();
        } else {
            callback(new ErrorApp('internal', 'Unable to find a signing key.'), null);
            return;
        }

        if (!signingKey) {
            callback(new ErrorApp('internal', 'Unable to find a signing key.'), null);
            return;
        }

        // logger.debug(`signingKey: ${JSON.stringify(signingKey)}`)
        callback(null, signingKey);
    });
}

export async function validateJwt(request: FastifyRequest, reply: FastifyReply) {
    const url = await getOidpUrl();
    if (!url) {
        logger.error(`Cannot read OIDP url from config. Pass`)
        return
    }
    const token = request.headers.authorization?.split(' ')[1]
    if (!token) {
        reply.code(401).send({ error: 'No token provided.' });
        return;
    }

    if (!jwksClient) {
        logger.warn('JWKS client not initialized. Initialize...')
        jwksClient = await initializeJwksClient()
    }

    // logger.debug(`token: ${JSON.stringify(token)}`)
    try {
        const decoded: TokenUser = await new Promise((resolve, reject) => {
            jwt.verify(token, getKey, {
                issuer: url.toString(),
                algorithms: ['RS256']
            }, (err, decoded) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded as TokenUser);
                }
            });
        });

        if (!decoded) {
            throw new Error('decoded token does not exists');
        }

        // logger.debug(`decoded: ${JSON.stringify(decoded)}`)
        request.user = {
            id: decoded.sub,
            name: decoded.name,
            roles: decoded.realm_access.roles
        }
    } catch (err) {
        if (err instanceof Error) {
            logger.error(err.message)
        }
        reply.code(401).send({ error: 'Unauthorized: Invalid token.' });
    }
}

