import { FastifyInstance } from 'fastify';
import { Response } from 'light-my-request';
import { Test, test } from 'tap';
import { ImportMock } from 'ts-mock-imports';
import { mockServices } from '../../../__test__/mocked.services';
import { testCameraSchema } from '../../../__test__/test.schemas';
import buildServer from '../../../server';
import prisma from '../../../utils/prisma';
import * as cameraService from '../camera.service';


function removeProperty(obj, propName) {
    const { [propName]: _, ...rest } = obj;
    return rest;
}

function addProperty(obj, propName) {
    return { [propName]: null, ...obj };
}

function refreshBeforeTest(fastify: FastifyInstance, t: Test) {
    t.teardown(async () => {
        fastify.close()
        ImportMock.restore()
        await prisma.camera.deleteMany({})
    })
}

function httpResponseTest(t: Test, response: Response, statusCode: number = 200) {
    t.equal(response.statusCode, statusCode)
    t.equal(response.headers['content-type'], 'application/json; charset=utf-8')

}

const responseExample = {
    id: '65d0b991f6593bd703ff76ad',
    createAt: '2024-02-17T13:50:09.379Z',
    updateAt: '2024-02-17T13:50:09.379Z',
    name: 'Dr. Rudy Cummings PhD',
    state: null,
    url: 'https://hidden-reluctance.name/',
    frigateHost: {},
    roles: [],
    config: null
}

async function createCamera(fastify: FastifyInstance) {
    return await fastify.inject({
        method: 'POST',
        url: '/apiv1/cameras',
        payload: {
            name: testCameraSchema.name,
            url: testCameraSchema.url,
        }
    })
}

test(' GET cameras - get cameras from mock', async (t) => {
    mockServices(['camerasService'])
    const cameraServiceStub = ImportMock.mockClass(cameraService, 'default')
    cameraServiceStub.mock('getAllCameras', [testCameraSchema])
    const fastify = buildServer()

    t.teardown(() => {
        fastify.close()
        ImportMock.restore()
    })

    const response = await fastify.inject({
        method: 'GET',
        url: '/apiv1/cameras',
    })

    httpResponseTest(t, response)

    const json = response.json()
    t.match(json, [testCameraSchema])
})

test(' POST camera - create camera with test database', async (t) => {
    mockServices(['camerasService'])
    const fastify = buildServer()

    refreshBeforeTest(fastify, t)

    const createResponse = await createCamera(fastify)

    httpResponseTest(t, createResponse, 201)

    const json = createResponse.json()

    t.equal(json.name, testCameraSchema.name)
    t.equal(json.url, testCameraSchema.url)
})

test(' GET cameras - create by POST and get cameras from DB', async (t) => {
    mockServices(['camerasService'])
    const fastify = buildServer()

    refreshBeforeTest(fastify, t)

    const createResponse = await createCamera(fastify)

    const jsonCreate = createResponse.json()
    t.equal(jsonCreate.name, testCameraSchema.name)
    t.equal(jsonCreate.url, testCameraSchema.url)

    const response = await fastify.inject({
        method: 'GET',
        url: '/apiv1/cameras',
    })

    httpResponseTest(t, response)

    const jsonGet = response.json()
    t.equal(jsonGet[0].name, testCameraSchema.name)
    t.equal(jsonGet[0].url, testCameraSchema.url)
})
test(' GET camera - create by POST and get camera from DB', async (t) => {
    mockServices(['camerasService'])
    const fastify = buildServer()

    refreshBeforeTest(fastify, t)

    const createResponse = await createCamera(fastify)

    const jsonCreate = createResponse.json()
    t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
    t.equal(jsonCreate.name, testCameraSchema.name)
    t.equal(jsonCreate.url, testCameraSchema.url)

    const id = jsonCreate.id

    const response = await fastify.inject({
        method: 'GET',
        url: `/apiv1/cameras/${id}`,
    })

    httpResponseTest(t, response)

    const jsonGet = response.json()
    t.match(jsonGet, jsonCreate)
})
test(' PUT camera - create by POST and PUT changes to DB', async (t) => {
    mockServices(['camerasService'])
    const fastify = buildServer()

    refreshBeforeTest(fastify, t)

    const createResponse = await createCamera(fastify)

    const jsonCreate = createResponse.json()
    t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
    t.equal(jsonCreate.name, testCameraSchema.name)
    t.equal(jsonCreate.url, testCameraSchema.url)

    const { id, name, url } = jsonCreate

    const response = await fastify.inject({
        method: 'PUT',
        url: `/apiv1/cameras/`,
        payload: { id, name, url }
    })

    httpResponseTest(t, response, 201)

    const jsonGet = response.json()
    const jsonGetWithoutUpdateAt = removeProperty(jsonGet, 'updateAt');
    const jsonCreateWithoutUpdateAt = removeProperty(jsonCreate, 'updateAt')
    t.matchOnly(jsonGetWithoutUpdateAt, jsonCreateWithoutUpdateAt)
})
test(' DEL camera - create by POST and DEL from DB', async (t) => {
    mockServices(['camerasService'])
    const fastify = buildServer()

    refreshBeforeTest(fastify, t)

    const createResponse = await createCamera(fastify)

    const jsonCreate = createResponse.json()
    t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
    t.equal(jsonCreate.name, testCameraSchema.name)
    t.equal(jsonCreate.url, testCameraSchema.url)

    const response = await fastify.inject({
        method: 'DELETE',
        url: `/apiv1/cameras/${jsonCreate.id}`,
    })

    httpResponseTest(t, response)

    const jsonDelete = response.json()

    const jsonGetWithoutUpdateAt = removeProperty(jsonDelete, 'updateAt')
    const jsonCreateWithoutUpdateAt = removeProperty(jsonCreate, 'updateAt')
    t.matchOnly(jsonGetWithoutUpdateAt, jsonCreateWithoutUpdateAt)
})