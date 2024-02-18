import { FastifyReply, FastifyRequest, } from "fastify";
import { Issuer } from "openid-client";
import { OIDPUrls } from "../oidp/oidp.urls";
import { logger } from "../../utils/logger";
import { oidpSettingsKeys } from "../config/oidp.settings";
import { ErrorApp } from "./error.handler";
import ConfigService from "../config/config.service";

export interface UserInfo {
  sub: string
  email_verified: boolean
  name: string
  preferred_username: string
  given_name: string
  family_name: string
  email: string
}

interface OpenIdPrehandlerConfig {
  realmURL: string,
  clientId: string,
  clientSecret: string,
}

async function getConfig() {
  const configService = new ConfigService()
  const config: OpenIdPrehandlerConfig = {
    clientId: (await configService.getEncryptedConfig(oidpSettingsKeys.clientId)).value,
    clientSecret: (await configService.getEncryptedConfig(oidpSettingsKeys.clientSecret)).value,
    realmURL: (await configService.getEncryptedConfig(oidpSettingsKeys.realmUrl)).value,
  }
  return config
}

async function getOpenIdClient() {
  const config = await getConfig()
  if (!config) throw new ErrorApp('internal','Cannot get OpenIdPrehandlerConfig')
  const url = new URL(config.realmURL)
  const authUrl = `${url.toString()}${OIDPUrls.openidConfiguration}`
  const issuer = await Issuer.discover(authUrl)
  const client = new issuer.Client({
    'client_id': config.clientId,
    'client_secret': config.clientSecret,
  });

  return client;
}

export async function validateToken(request: FastifyRequest, reply: FastifyReply) {
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