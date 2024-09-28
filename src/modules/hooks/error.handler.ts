import { FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify";
import { logger } from "../../utils/logger";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

type Handler<T extends RouteGenericInterface = RouteGenericInterface> = (req: FastifyRequest<T>, rep: FastifyReply) => Promise<void>;


// erorr types
// internal
// validation

export class ErrorApp extends Error {
    code: string
    constructor (code: string, message: string) {
        super();
        this.code = code
        this.message = message
    }
}

export function withErrorHandler<T extends RouteGenericInterface>(handler: Handler<T>): Handler<T> {
    return async (req, rep) => {
        try {
            await handler(req, rep);
        } catch (e) {
            logger.error(e.message);
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                rep.code(500).send({
                    code: e.code,
                    message: 'Prisma error',
                });
            } else if (e instanceof Prisma.PrismaClientValidationError) {
                rep.code(400).send({
                    code: 'Prisma validation',
                    message: 'Prisma error',
                })
            } else if (e instanceof ZodError) {
                logger.debug(e.errors);
                if (e.errors[0].message) {
                    rep.code(400).send({
                        code: e.errors[0].code,
                        message: e.errors[0].message
                    });
                }
            } else if (e instanceof ErrorApp) {
                rep.code(400).send({
                    code: e.code,
                    message: e.message,
                });
            } else {
                rep.code(500).send({
                    code: 'unexpected',
                    message: e.message,
                });
                logger.error(e.name);
            }
        }
    };
}