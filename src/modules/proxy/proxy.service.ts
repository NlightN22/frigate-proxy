import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";
import axios, { AxiosRequestConfig } from "axios";
import { ProxyQueryParams, proxyQueryParams } from "./proxy.schema";

export async function proxyService(request: FastifyRequest<{
    Querystring: ProxyQueryParams
}>, reply: FastifyReply) {
    const { method, body, query, params } = request;

    const requestBody = body as any
    const { hostName } = proxyQueryParams.parse(query)
    const requestParams = params as any

    logger.debug(`body: ${JSON.stringify(body)}`)
    logger.debug(`query: ${JSON.stringify(query)}`)
    logger.debug(`params: ${JSON.stringify(params)}`)
    logger.debug(`method: ${JSON.stringify(method)}`)

    const targetUrl = `http://${hostName}/${requestParams['*']}`

    const config: AxiosRequestConfig = {
        method: method as any,
        url: targetUrl,
        ...requestBody && { data: requestBody },
        ...requestParams && { params: requestParams },
    };

    logger.debug(`target request: ${JSON.stringify(config)}`)

    try {
        const response = await axios(config)
        reply.code(response.status).send(response.data)
        logger.info(`target ${hostName} response OK`)
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            reply.code(error.response.status).send(error.response.data);
        } else {
            reply.code(502).send({ error: 'Bad Gateway' });
        }
        logger.error(error.message)
    }
}