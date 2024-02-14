import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwksRsa, { expressJwtSecret } from "jwks-rsa";
import { OIDP } from "../../consts";
import * as jwt from 'jsonwebtoken'
import { logger } from "../../utils/logger";
import { TokenUser } from "./token.shchema";

const secretProvider = expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${OIDP.url.toString()}/protocol/openid-connect/certs`,
})

const jwksClient = jwksRsa({
    jwksUri: `${OIDP.url.toString()}/protocol/openid-connect/certs`
})

function getKey(header, callback) {
    jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err, null);
            return;
        }
        if (!key) throw Error('key does not exists')
        let signingKey;
        if ('rsaPublicKey' in key) {
            signingKey = key.rsaPublicKey;
        } else if ('getPublicKey' in key) {
            signingKey = key.getPublicKey();
        } else {
            callback(new Error('Unable to find a signing key.'), null);
            return;
        }

        if (!signingKey) {
            callback(new Error('Unable to find a signing key.'), null);
            return;
        }

        // logger.debug(`signingKey: ${JSON.stringify(signingKey)}`)
        callback(null, signingKey);
    });
}

export async function validateJwt(request: FastifyRequest, reply: FastifyReply) {
    const token = request.headers.authorization?.split(' ')[1]
    if (!token) {
        reply.code(401).send({ error: 'No token provided.' });
        return;
    }

    // logger.debug(`token: ${JSON.stringify(token)}`)
    try {
        const decoded: TokenUser = await new Promise((resolve, reject) => {
            jwt.verify(token, getKey, {
                issuer: OIDP.url.toString(),
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
        reply.code(401).send({ error: 'Unauthorized: Invalid token.' });
    }
}