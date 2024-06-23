import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";
import { logger } from "../../utils/logger";

export async function logRequest(request: FastifyRequest, reply: FastifyReply) {
    logger.http(`Request: ${request.method} ${request.url} from ${request.ip}:${request.socket.remotePort}`);
}

export async function logResponse(request: FastifyRequest, reply: FastifyReply) {
    logger.http(`Response: ${reply.statusCode} code at ${reply.elapsedTime.toFixed(2)}ms on ${request.method} ${request.url} to ${request.ip}:${request.socket.remotePort}`);
}