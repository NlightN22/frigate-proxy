import { FastifyInstance } from "fastify";
import { Response } from 'light-my-request';
import { Test } from "tap";
import prisma from "../utils/prisma";


export function removeProperty(obj, propName) {
    const { [propName]: _, ...rest } = obj;
    return rest;
}

export function addProperty(obj, propName) {
    return { [propName]: null, ...obj };
}

export function cleanAfterTest(fastify: FastifyInstance, t: Test) {
    t.teardown(async () => {
        fastify.close()
        await prisma.camera.deleteMany({})
        await prisma.frigateHost.deleteMany({})
    })
}

export function httpResponseTest(t: Test, response: Response, statusCode: number = 200) {
    t.equal(response.statusCode, statusCode)
    t.equal(response.headers['content-type'], 'application/json; charset=utf-8')

}