import { FastifyReply, FastifyRequest } from "fastify";
import { SocketStream } from '@fastify/websocket';
import { logger } from "../../utils/logger";
import WebSocket from 'ws';
import { ProxyWsParamsSchema, proxyWsParams } from "./proxy.ws.schema";


type Connections = {
    source: WebSocket | undefined,
    target: WebSocket | undefined
}

export async function proxyWsService(connection: SocketStream, req: FastifyRequest<{
    Params: ProxyWsParamsSchema
}>) {
    const source = connection.socket
    const connections: Connections = {
        source: source,
        target: undefined
    }
    try {
        const { body, query, params, url } = req;

        let hostName: string | undefined
        try {
          const parsed = proxyWsParams.parse(params)
          hostName = parsed.hostName
        } catch (e) {
          if (e instanceof Error) close(connections, 1011, e.message)
        }
        if (!hostName) close(connections, 1011, 'Need hostname at params')
        const requestParams = params as any

        logger.debug(`body: ${JSON.stringify(body)}`)
        logger.debug(`query: ${JSON.stringify(query)}`)
        logger.debug(`params: ${JSON.stringify(params)}`)
        logger.debug(`hostName: ${JSON.stringify(hostName)}`)
        logger.debug(`url: ${JSON.stringify(url)}`)


        const targetUrl = `ws://${hostName}/${requestParams['*']}`
        logger.debug(`targetUrl: ${JSON.stringify(targetUrl)}`)

        const target = new WebSocket(`${targetUrl}`);
        connections.target = target

        // source connection socket
        source.on('message', (data, binary) => waitConnection(target, () => target.send(data, { binary })))
        source.on('ping', data => waitConnection(target, () => target.ping(data)))
        source.on('pong', data => waitConnection(target, () => target.pong(data)))
        source.on('close', close)
        source.on('error', error => close(connections, 1011, error.message))
        source.on('unexpected-response', () => close(connections, 1011, 'unexpected response'))
        // target connection socket
        target.on('message', (data, binary) => source.send(data, { binary }))
        target.on('ping', data => source.ping(data))
        target.on('pong', data => source.pong(data))
        target.on('close', close)
        target.on('error', error => close(connections, 1011, error.message))
        target.on('unexpected-response', () => close(connections, 1011, 'unexpected response'))

    } catch (e) {
        logger.error(e.message)
        close(connections, 1011, e.message)
        return
    }
}

function close(connections: Connections, code: number, reason: string) {
    if (connections.source) closeWebSocket(connections.source, code, reason)
    if (connections.target) closeWebSocket(connections.target, code, reason)
}

function closeWebSocket(socket: WebSocket, code: number, reason: string) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.close(liftErrorCode(code), truncateReason(reason))
    }
}

function waitConnection(socket, write) {
    if (socket.readyState === WebSocket.CONNECTING) {
        socket.once('open', write)
    } else {
        write()
    }
}

//The value must be no longer than 123 bytes https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close
function truncateReason(reason: string, maxLength = 123) {
    const ellipsis = '...'
    const maxEncodedLength = maxLength - new TextEncoder().encode(ellipsis).length
    let encoded = new TextEncoder().encode(reason);
    if (encoded.length <= maxEncodedLength) {
        return reason;
    }

    while (encoded.length > maxEncodedLength) {
        reason = reason.slice(0, -1);
        encoded = new TextEncoder().encode(reason);
    }

    return reason + ellipsis;
}

function liftErrorCode(code) {
    if (typeof code !== 'number') {
        // Sometimes "close" event emits with a non-numeric value
        return 1011
    } else if (code === 1004 || code === 1005 || code === 1006) {
        // ws module forbid those error codes usage, lift to "application level" (4xxx)
        return 3000 + code
    } else {
        return code
    }
}
