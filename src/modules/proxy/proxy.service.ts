import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";
import axios, { AxiosRequestConfig } from "axios";
import { ProxyQueryParams, proxyQueryParams } from "./proxy.schema";
import { stringify } from "querystring";

export async function proxyService(request: FastifyRequest<{
    Querystring: any
}>, reply: FastifyReply) {
    const { method, body, query, params } = request;

    const requestBody = body as any
    const { hostName, ...rest } = query as any
    if (!hostName) reply.code(400).send({ error: 'Need hostname at query' })
    const requestParams = params as any

    logger.debug(`body: ${JSON.stringify(body)}`)
    logger.debug(`query: ${JSON.stringify(query)}`)
    logger.debug(`params: ${JSON.stringify(params)}`)
    logger.debug(`method: ${JSON.stringify(method)}`)

    const queryString = stringify(rest)

    const targetUrl = `http://${hostName}/${requestParams['*']}${queryString ? '?' + queryString : ''}`;

    const config: AxiosRequestConfig = {
        method: method as any,
        url: targetUrl,
        ...requestBody && { data: requestBody },
        ...requestParams && { params: requestParams },
    };

    logger.debug(`target request: ${JSON.stringify(config)}`)

    try {
        const response = await axios(config)
        Object.keys(response.headers).forEach((key) => {
            if (!['content-length', 'content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
                reply.header(key, response.headers[key]);
            }
        });
        
        reply.status(response.status);
        response.data.pipe(reply.raw);
        logger.info(`target ${hostName} response OK`)
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            Object.entries(error.response.headers).forEach(([key, value]) => {
                reply.header(key, value);
            });
            reply.code(error.response.status).send(error.response.data);
        } else {
            reply.code(502).send({ error: 'Bad Gateway' });
        }
        logger.error(error.message)
    }
}