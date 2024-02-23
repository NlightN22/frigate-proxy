import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";
import { stringify } from "querystring";
import http from 'http'
import https from 'https'
import { ProxyParamsSchema, proxyParams } from "./proxy.schema";

export async function httpProxyService(request: FastifyRequest<{
  Params: ProxyParamsSchema
}>, reply: FastifyReply) {
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
  logger.silly(`query hostName: ${JSON.stringify(hostName)}`)

  const queryString = stringify(query as any)

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

  logger.silly(`target path: ${JSON.stringify(path)}`)
  logger.silly(`target method: ${JSON.stringify(method)}`)
  logger.silly(`target headers after: ${JSON.stringify(headers)}`)
  logger.silly(`target hostname: ${JSON.stringify(hostname)}`)
  logger.silly(`target port: ${JSON.stringify(port)}`)

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
      logger.silly(`target response status: ${res.statusCode}`);
      logger.silly(`target response headers: ${JSON.stringify(res.headers)}`);
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
      logger.debug(`Proxy request to ${hostName} at ${path} is finished with code ${res.statusCode}`)
      logger.silly(`Target reply headers ${JSON.stringify(res.headers)}`)
      resolve()
    });

    if (request.raw.method !== 'GET' && request.raw.method !== 'HEAD' && request.body) {
      proxyRequest.write(JSON.stringify(request.body));
    }

    proxyRequest.on('error', (error) => {
      logger.debug(`Proxy request to ${hostName} at ${path} is finished with error`)
      reply.send(error);
      reject(error)
    });

    request.raw.pipe(proxyRequest);
    request.raw.on('end', () => {
      proxyRequest.end();
    });
  })
}