import { test } from 'tap';
import { ImportMock } from 'ts-mock-imports';
import buildServer from '../../../server';
import { faker, ur } from '@faker-js/faker'

import * as oidpService from '../../oidp/oidp.service';
import * as frigateHostsService from '../..//frigate-hosts/frigate-hosts.service';
import * as rolesService from '../../roles/roles.service';
import * as cameraService from '../../camera/camera.service';
import { FastifyInstance } from 'fastify';
import prisma from '../../../utils/prisma';


const mockServices = () => {
    const hostServiceStub = ImportMock.mockClass(frigateHostsService, 'default')
    const rolesServiceStub = ImportMock.mockClass(rolesService, 'default')
    const oidpServiceStub = ImportMock.mockClass(oidpService, 'default')
}

function removeProperty(obj, propName) {
    const { [propName]: _, ...rest } = obj;
    return rest;
}

const cameraSchema = {
    id: faker.database.mongodbObjectId(),
    createAt: faker.date.anytime().toString(),
    updateAt: faker.date.anytime().toString(),
    name: faker.person.fullName(),
    url: faker.internet.url(),
    state: faker.datatype.boolean(),
}

const responseExample = {
    id: '65d0b991f6593bd703ff76ad',
    createAt: '2024-02-17T13:50:09.379Z',
    updateAt: '2024-02-17T13:50:09.379Z',
    name: 'Dr. Rudy Cummings PhD',
    state: null,
    url: 'https://hidden-reluctance.name/',
    frigateHost: {},
    roles: []
}

async function createCamera(fastify: FastifyInstance) {
    return await fastify.inject({
        method: 'POST',
        url: '/apiv1/cameras',
        payload: {
            name: cameraSchema.name,
            url: cameraSchema.url
        }
    })
}

test(' POST camera - create camera with test database', async (t) => {
    mockServices()
    const fastify = buildServer()

    t.teardown(async () => {
        fastify.close()
        ImportMock.restore()
        await prisma.camera.deleteMany({})
    })

    const createResponse = await createCamera(fastify)

    t.equal(createResponse.statusCode, 201)
    t.equal(createResponse.headers['content-type'], 'application/json; charset=utf-8')

    const json = createResponse.json()

    t.equal(json.name, cameraSchema.name)
    t.equal(json.url, cameraSchema.url)
})

test(' GET cameras - get cameras from mock', async (t) => {
    mockServices()
    const cameraServiceStub = ImportMock.mockClass(cameraService, 'default')
    cameraServiceStub.mock('getAllCameras', [cameraSchema])
    const fastify = buildServer()

    t.teardown(() => {
        fastify.close()
        ImportMock.restore()
    })

    const response = await fastify.inject({
        method: 'GET',
        url: '/apiv1/cameras',
    })

    t.equal(response.statusCode, 200)
    t.equal(response.headers['content-type'], 'application/json; charset=utf-8')

    const json = response.json()
    t.match(json, [cameraSchema])
})

test(' GET cameras - create by POST and get cameras from DB', async (t) => {
    mockServices()
    const fastify = buildServer()

    t.teardown(async () => {
        fastify.close()
        ImportMock.restore()
        await prisma.camera.deleteMany({})
    })

    const createResponse = await createCamera(fastify)

    const jsonCreate = createResponse.json()
    t.equal(jsonCreate.name, cameraSchema.name)
    t.equal(jsonCreate.url, cameraSchema.url)

    const response = await fastify.inject({
        method: 'GET',
        url: '/apiv1/cameras',
    })

    t.equal(response.statusCode, 200)
    t.equal(response.headers['content-type'], 'application/json; charset=utf-8')

    const jsonGet = response.json()
    t.equal(jsonGet[0].name, cameraSchema.name)
    t.equal(jsonGet[0].url, cameraSchema.url)
})


test(' GET camera - create by POST and get camera from DB', async (t) => {
    mockServices()
    const fastify = buildServer()

    t.teardown(async () => {
        fastify.close()
        ImportMock.restore()
        await prisma.camera.deleteMany({})
    })

    const createResponse = await createCamera(fastify)

    const jsonCreate = createResponse.json()
    t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
    t.equal(jsonCreate.name, cameraSchema.name)
    t.equal(jsonCreate.url, cameraSchema.url)

    const id = jsonCreate.id

    const response = await fastify.inject({
        method: 'GET',
        url: `/apiv1/cameras/${id}`,
    })

    t.equal(response.statusCode, 200)
    t.equal(response.headers['content-type'], 'application/json; charset=utf-8')

    const jsonGet = response.json()
    t.match(jsonGet, jsonCreate)
})
test(' PUT camera - create by POST and PUT changes to DB', async (t) => {
    mockServices()
    const fastify = buildServer()

    t.teardown(async () => {
        fastify.close()
        ImportMock.restore()
        await prisma.camera.deleteMany({})
    })

    const createResponse = await createCamera(fastify)

    const jsonCreate = createResponse.json()
    t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
    t.equal(jsonCreate.name, cameraSchema.name)
    t.equal(jsonCreate.url, cameraSchema.url)

    jsonCreate.name = faker.person.fullName()

    const { id, name, url } = jsonCreate

    const response = await fastify.inject({
        method: 'PUT',
        url: `/apiv1/cameras/`,
        payload: { id, name, url }
    })

    t.equal(response.statusCode, 201)
    t.equal(response.headers['content-type'], 'application/json; charset=utf-8')

    const jsonGet = response.json()
    const jsonGetWithoutUpdateAt = removeProperty(jsonGet, 'updateAt');
    const jsonCreateWithoutUpdateAt = removeProperty(jsonCreate, 'updateAt')
    t.matchOnly(jsonGetWithoutUpdateAt, jsonCreateWithoutUpdateAt)
})
test(' DEL camera - create by POST and DEL from DB', async (t) => {
    mockServices()
    const fastify = buildServer()

    t.teardown(async () => {
        fastify.close()
        ImportMock.restore()
        await prisma.camera.deleteMany({})
    })

    const createResponse = await createCamera(fastify)

    const jsonCreate = createResponse.json()
    t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
    t.equal(jsonCreate.name, cameraSchema.name)
    t.equal(jsonCreate.url, cameraSchema.url)

    const response = await fastify.inject({
        method: 'DELETE',
        url: `/apiv1/cameras/${jsonCreate.id}`,
    })

    t.equal(response.statusCode, 200)
    t.equal(response.headers['content-type'], 'application/json; charset=utf-8')

    const jsonGet = response.json()
    const jsonGetWithoutUpdateAt = removeProperty(jsonGet, 'updateAt');
    const jsonCreateWithoutUpdateAt = removeProperty(jsonCreate, 'updateAt')
    t.matchOnly(jsonGetWithoutUpdateAt, jsonCreateWithoutUpdateAt)
})