import { FastifyInstance } from "fastify";
import { Response } from 'light-my-request';
import { Test } from "tap";
import prisma from "../utils/prisma";
import zodToJsonSchema from "zod-to-json-schema";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { z } from "zod";


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
    references.forEach( prop => {
        obj = removeProperty(obj, prop)
    })
    return obj
}

export function matchWOTimeFields(t: Test, found: any, wanted: any) {
    const properties = ['updatedAt', 'createdAt']
    properties.forEach( prop => {
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
