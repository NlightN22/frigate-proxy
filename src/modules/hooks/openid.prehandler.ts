import { FastifyReply, FastifyRequest, } from "fastify";
import { Issuer } from "openid-client";
import { OIDP } from "../../consts";
import { OIDPUrls } from "../auth/oidp.urls";
import { User } from "../users/users.schema";
import { logger } from "../../utils/logger";

export interface UserInfo {
  sub: string
  email_verified: boolean
  name: string
  preferred_username: string
  given_name: string
  family_name: string
  email: string
}

async function getOpenIdClient() {
  const authUrl = `${OIDP.url.toString()}${OIDPUrls.openidConfiguration}`
  const issuer = await Issuer.discover(authUrl)
  const client = new issuer.Client({
    'client_id': OIDP.clientID,
    'client_secret': OIDP.clientSecret,
  });

  return client;
}

export async function validateToken(request:FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new Error('Token not found in authorization header');
    }

    const client = await getOpenIdClient();
    const userinfo = await client.userinfo(token) as any;

    request.user = userinfo;
    logger.debug(`request.user : ${JSON.stringify(request.user)}`)


  } catch (error) {
    logger.error(error.message)
    reply.code(401).send({ error: 'Unauthorized' });
  }
}