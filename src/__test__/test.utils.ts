import { FastifyInstance } from "fastify";
import { Response } from 'light-my-request';
import { Test } from "tap";
import prisma from "../utils/prisma";
import zodToJsonSchema from "zod-to-json-schema";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { z } from "zod";
import sinon from "sinon";
import * as jwt from 'jsonwebtoken';


export function removeProperty(obj: any | undefined, propName: string) {
    if (!obj) return undefined
    if (!Object.keys(obj).includes(propName)) return obj
    const { [propName]: _, ...rest } = obj;
    return rest;
}

export function addProperty(obj: any, propName: string) {
    if (!obj) return undefined
    return { [propName]: null, ...obj };
}

export function cleanAfterTest(fastify: FastifyInstance, t: Test) {
    t.teardown(async () => {
        fastify.close()
        await prisma.camera.deleteMany({})
        await prisma.frigateHost.deleteMany({})
    })
}

export function httpResponseTest(t: Test, response: Response, wantedStatusCode: number = 200) {
    if (wantedStatusCode !== response.statusCode) console.error(response)
    t.equal(response.statusCode, wantedStatusCode)
    t.equal(response.headers['content-type'], 'application/json; charset=utf-8')
}

export function cleanObjectByZodSchema(zodSchema: z.ZodType<any>, obj: object) {
    const jsonSchema = zodToJsonSchema(zodSchema);
    const ajv = new Ajv({
        removeAdditional: true,
    });
    addFormats(ajv);
    const validate = ajv.compile(jsonSchema);
    const data = JSON.parse(JSON.stringify(obj));
    validate(data);
    return data;
}

export function cleanFromReferencesIds(obj: any) {
    const references = ['frigateHostId', 'rolesIDs', 'tagIds']
    references.forEach(prop => {
        obj = removeProperty(obj, prop)
    })
    return obj
}

export function matchWOTimeFields(t: Test, found: any, wanted: any) {
    const properties = ['updatedAt', 'createdAt']
    properties.forEach(prop => {
        found = removeProperty(found, prop)
        wanted = removeProperty(wanted, prop)
    })

    t.match(found, wanted)
}

export function sameObjectsFieldsTest(
    test: Test,
    found: any,
    wanted: any,
    message: string = 'Objects should have the same fields'
) {
    test.same(
        [...new Set(Object.keys(found))].sort(),
        [...new Set(Object.keys(wanted))].sort(),
        message
    );
};


export type JwtTestResponse = {
    sub: string,
    name: string,
    realm_access: { roles: string[] },
}

export function mockjJWTverify(
    jwtTestResponse: JwtTestResponse,
    error: boolean = false) {
    const jwt = require('jsonwebtoken');

    return sinon.stub(jwt, 'verify').callsFake((
        token: string,
        secretOrPublicKey: jwt.Secret | jwt.GetPublicKeyOrSecret,
        options: jwt.VerifyOptions | undefined,
        callback?: jwt.VerifyCallback
    ) => {
        if (typeof callback === 'function') {
            if (error) {
                return callback(new jwt.JsonWebTokenError('Invalid token'), undefined);
            }
            return callback(null, {
                sub: jwtTestResponse.sub,
                name: jwtTestResponse.name,
                realm_access: jwtTestResponse.realm_access
            });
        }
    });
}