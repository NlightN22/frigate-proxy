import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";
import { stringify } from "querystring";
import http from 'http'
import https from 'https'

export async function httpProxyService(request: FastifyRequest<{
  Querystring: any
}>, reply: FastifyReply) {
  const { body, query, params } = request;

  const requestBody = body as any
  const { hostName, ...rest } = query as any
  if (!hostName) reply.code(400).send({ error: 'Need hostname at query' })
  const requestParams = params as any
  logger.silly(`query hostName: ${JSON.stringify(hostName)}`)

  const queryString = stringify(rest)

  const target = `http://${hostName}/${requestParams['*']}${queryString ? '?' + queryString : ''}`

  const isHttps = target.startsWith('https');
  const targetUrl = new URL(target);

  const path = targetUrl.pathname + targetUrl.search
  const method = request.raw.method
  const headers = { ...request.headers, host: targetUrl.host };
  delete headers['content-length']
  delete headers['authorization']
  const port = targetUrl.port
  const hostname = targetUrl.hostname

  logger.silly(`target path: ${JSON.stringify(path)}`)
  logger.silly(`target method: ${JSON.stringify(method)}`)
  logger.silly(`target headers: ${JSON.stringify(headers)}`)
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
      reply.raw.writeHead(res.statusCode || 500, res.headers);
      res.pipe(reply.raw);
      resolve()
    });

    if (request.raw.method !== 'GET' && request.raw.method !== 'HEAD' && request.body) {
      proxyRequest.write(JSON.stringify(request.body));
    }

    proxyRequest.on('error', (error) => {
      reply.send(error);
      reject(error)
    });

    request.raw.pipe(proxyRequest);
    request.raw.on('end', () => {
      proxyRequest.end();
    });
  })
}