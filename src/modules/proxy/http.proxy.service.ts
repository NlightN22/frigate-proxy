import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";
import { stringify } from "querystring";
import http, { request } from 'http'
import https from 'https'
import { ProxyParamsSchema, proxyParams } from "./proxy.schema";
import ConfigService from "../config/config.service";

export const allowedNotUserRoutes = [
  /^api\/events\/[^\/]+\/clip\.mp4$/,
  /^api\/config\/schema\.json$/,
]

export const allowedNotAdminRoutes = [
  /^vod\/.+?\/[^\/]+\.m3u8$/,
  /^vod\/.+?\/[^\/]+\.ts$/,
  /^vod\/.+?\/[^\/]+\.mp4$/,
  /^vod\/.+?\/[^\/]+\.m4s$/,
  /^api\/export\/[^\/]+\/start\/\d+\/end\/\d+$/,
  /^api\/export\/[^\/]+\.mp4$/,
  /^exports\/$/,
  /^api\/events$/,
  /^api\/events\/[^\/]+\/thumbnail\.jpg$/,
  /^api\/[^\/]+\/events\/summary$/,
  /^api\/[^\/]+\/recordings\/.*$/,
  /^api\/[^\/]+\/latest\.jpg$/,
  ...allowedNotUserRoutes,
]

export const getRequestPath = (request: FastifyRequest) => {
  const requestParams = request.params as any
  return requestParams['*'] as string
}

export async function httpProxyService(request: FastifyRequest<{
  Params: ProxyParamsSchema
}>, reply: FastifyReply) {
  const configService = ConfigService.getInstance()
  const { body, query, params } = request;
  let hostName: string | undefined
  try {
    const parsed = proxyParams.parse(params)
    hostName = parsed.hostName
  } catch (e) {
    if (e instanceof Error) reply.code(400).send(e.message)
  }
  if (!hostName) reply.code(400).send({ error: 'Need hostname at params' })
  const requestParams = params as any
  logger.silly(`httpProxyService query request params: ${JSON.stringify(requestParams)}`)
  logger.silly(`httpProxyService query hostName: ${JSON.stringify(hostName)}`)

  const queryString = stringify(query as any)

  // controlled request params and roles
  const adminRole = await configService.getAdminRole()
  if (adminRole?.value) {
    const requestPath = requestParams['*']
    const isAllowedRoute = allowedNotAdminRoutes.some(pattern => pattern.test(requestPath))
    logger.silly(`httpProxyService query request allowed role: ${isAllowedRoute}`)
    if (!isAllowedRoute && !(request.user?.roles.some(role => role === adminRole.value))) {
      logger.debug(`httpProxyService query request params: ${JSON.stringify(requestParams)}`)
      logger.error(`httpProxyService Not allowed route and not admin:${adminRole.value} at user roles:${JSON.stringify(request.user?.roles)}`)
      return reply.code(403).send({ error: 'Not allowed role and allowed route to proxy' })
    }
  }

  const target = `http://${hostName}/${requestParams['*']}${queryString ? '?' + queryString : ''}`

  const isHttps = target.startsWith('https');
  const targetUrl = new URL(target);

  const path = targetUrl.pathname + targetUrl.search
  const method = request.raw.method
  logger.silly(`target headers before: ${JSON.stringify(request.headers)}`)
  const headers = {
    ...request.headers,
    host: targetUrl.host,

  };
  headers['sec-fetch-site'] = 'none'
  headers['sec-fetch-mode'] = 'navigate'
  delete headers['origin']
  delete headers['content-length']
  delete headers['authorization']
  delete headers['referer']
  const port = targetUrl.port
  const hostname = targetUrl.hostname

  logger.silly(`httpProxyService target path: ${JSON.stringify(path)}`)
  logger.silly(`httpProxyService target method: ${JSON.stringify(method)}`)
  logger.silly(`httpProxyService target headers after: ${JSON.stringify(headers)}`)
  logger.silly(`httpProxyService target hostname: ${JSON.stringify(hostname)}`)
  logger.silly(`httpProxyService target port: ${JSON.stringify(port)}`)

  const options = {
    hostname: hostname,
    port: port || (isHttps ? 443 : 80),
    path: path,
    method: method,
    headers: headers,
  };

  const proxy = isHttps ? https : http;

  return new Promise<void>((resolve, reject) => {
    const proxyRequest = proxy.request(options, (res) => {
      logger.silly(`Target response status: ${res.statusCode}`);
      logger.silly(`Target response headers: ${JSON.stringify(res.headers)}`);
      // delete CORS
      delete res.headers["access-control-allow-origin"]
      delete res.headers["access-control-allow-methods"]
      delete res.headers["access-control-allow-headers"]
      delete res.headers["access-control-allow-credentials"]
      // Add CORS
      const headersWithCors = { ...res.headers, 'Access-Control-Allow-Origin': '*' }
      // Change response code
      reply.raw.writeHead(res.statusCode || 500, headersWithCors);

      res.pipe(reply.raw);
      logger.debug(`httpProxyService Proxy request to ${hostName} at ${path} is finished with code ${res.statusCode}`)
      logger.silly(`httpProxyService Proxy reply headers ${JSON.stringify(res.headers)}`)
      resolve()
    });

    if (request.raw.method !== 'GET' && request.raw.method !== 'HEAD' && request.body) {
      const contentType = request.headers['content-type']
      let bodyData
      if (contentType === 'application/json') {
        bodyData = JSON.stringify(request.body)
      } else {
        bodyData = request.body
      }
      proxyRequest.write(bodyData);
    }

    proxyRequest.on('error', (error) => {
      logger.debug(`httpProxyService Proxy request to ${hostName} at ${path} is finished with error`)
      reply.send(error);
      reject(error)
    });

    request.raw.pipe(proxyRequest);
    request.raw.on('end', () => {
      proxyRequest.end();
    });
  })
}
