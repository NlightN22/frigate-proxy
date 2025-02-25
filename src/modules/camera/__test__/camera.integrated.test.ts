import { faker } from '@faker-js/faker';
import { FastifyInstance } from "fastify";
import { test } from "tap";
import { mockServices } from "../../../__test__/mocked.services";
import { cleanObjectByZodSchema, httpResponseTest, matchWOTimeFields, mockjJWTverify, sameObjectsFieldsTest } from "../../../__test__/test.utils";
import buildServer from "../../../server";
import prisma from "../../../utils/prisma";
import { responseCameraStateSchema } from "../camera.core.schema";
import { responseCameraSchema } from "../camera.schema";
import { MockedServices } from '../../../__test__/test.types';
import Sinon from 'sinon';
import { promisify } from 'util';

const testCameraSchema = {
    tags: [],
    url: faker.internet.url(),
    name: faker.person.fullName(),
    id: faker.database.mongodbObjectId(),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
    frigateHostId: faker.database.mongodbObjectId(),
    rolesIDs: [faker.database.mongodbObjectId()],
    state: null,
    config: null,
    tagIds: [faker.database.mongodbObjectId()],
    frigateHost: {},
    roles: [],
}

const dbCamera = {
    url: faker.internet.url(),
    name: faker.person.fullName(),
    id: faker.database.mongodbObjectId(),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
    frigateHostId: faker.database.mongodbObjectId(),
    rolesIDs: [faker.database.mongodbObjectId()],
    state: faker.datatype.boolean(),
    config: faker.getMetadata() as Record<string, any>,
    tagIds: [faker.database.mongodbObjectId()]
}

const adminJWTResponse = {
    sub: '12345',
    name: 'Test User',
    realm_access: { roles: ['admin'] }
}

const userJWTResponse = {
    sub: '12345',
    name: 'Test User',
    realm_access: { roles: ['user'] }
}

const mockedOIDPConfig = {
    clientId: 'testId',
    clientSecret: 'testSecret',
    clientUsername: 'testUsername',
    clientPassword: 'testPassword',
    clientURL: 'https://fake-oidc.com/',
}

const adminRole = {
    id: faker.database.mongodbObjectId(),
    key: faker.database.mongodbObjectId(),
    value: 'admin',
    encrypted: false,
    description: faker.book.genre(),
}

test('Camera integrated tests', t => {
    let fastify: FastifyInstance
    let mocks: MockedServices
    let jwtmock: Sinon.SinonStub<any[], any>

    t.before(() => {
        mocks = mockServices(['camerasService'])
        fastify = buildServer()
        mocks.configService?.getAdminRole.resolves(adminRole)
    })

    t.beforeEach(async (t) => {
        await prisma.camera.create({
            data: dbCamera
        })

        jwtmock = mockjJWTverify(adminJWTResponse)
        mocks.configOIDPService?.getDecryptedOIDPConfig.resolves(mockedOIDPConfig);
    })

    t.afterEach(async (t) => {
        await prisma.camera.deleteMany({})
        jwtmock.restore()
    })

    t.test('POST create camera', async (t) => {
        const postCameraResponse = await fastify.inject({
            method: 'POST',
            url: '/apiv1/cameras',
            payload: {
                name: testCameraSchema.name,
                url: testCameraSchema.url,
            },
            headers: { authorization: 'Bearer valid_token' },
        })
        const postCameraResponseJson = postCameraResponse.json()
        httpResponseTest(t, postCameraResponse, 201)
        t.equal(postCameraResponseJson.name, testCameraSchema.name)
        t.equal(postCameraResponseJson.url, testCameraSchema.url)
        const cleanedCameraResponse = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema)
        sameObjectsFieldsTest(t, postCameraResponseJson, cleanedCameraResponse)
    })

    t.test('GET cameras, admin user', async (t) => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/apiv1/cameras',
            headers: { authorization: 'Bearer valid_token' },
        })

        httpResponseTest(t, response)
        const firstElement = response.json()[0]
        const cleanedCamera = cleanObjectByZodSchema(responseCameraSchema, dbCamera)
        matchWOTimeFields(t, firstElement, cleanedCamera)
    })

    t.test('GET cameras, not admin user, should return empty list', async (t) => {
        jwtmock.restore()
        jwtmock = mockjJWTverify(userJWTResponse)
        const response = await fastify.inject({
            method: 'GET',
            url: '/apiv1/cameras',
            headers: { authorization: 'Bearer valid_token' },
        })
        httpResponseTest(t, response)
        t.ok(response.json().length === 0)
    })

    t.test('GET camera by id', async (t) => {
        const response = await fastify.inject({
            method: 'GET',
            url: `/apiv1/cameras/${dbCamera.id}`,
            headers: { authorization: 'Bearer valid_token' },
        })

        httpResponseTest(t, response)
        const cleanedCamera = cleanObjectByZodSchema(responseCameraSchema, dbCamera)
        matchWOTimeFields(t, response.json(), cleanedCamera)
    })

    t.test('GET cameras by host id', async (t) => {
        const response = await fastify.inject({
            method: 'GET',
            url: `/apiv1/cameras/host/${dbCamera.frigateHostId}`,
            headers: { authorization: 'Bearer valid_token' },
        })

        httpResponseTest(t, response)
        const firstElement = response.json()[0]
        const cleanedCamera = cleanObjectByZodSchema(responseCameraSchema, dbCamera)
        matchWOTimeFields(t, firstElement, cleanedCamera)
    })

    t.test('GET camera state', async (t) => {
        const response = await fastify.inject({
            method: 'GET',
            url: `/apiv1/cameras/${dbCamera.id}/state`,
        })

        httpResponseTest(t, response)
        const cleanedCamera = cleanObjectByZodSchema(responseCameraStateSchema, dbCamera)
        matchWOTimeFields(t, response.json(), cleanedCamera)
    })

    t.test('POST create camera. Should return 400', async (t) => {
        const payload = {
            name: testCameraSchema.name,
            frigateHostId: testCameraSchema.frigateHostId,
            config: testCameraSchema.config,
        };

        const response = await fastify.inject({
            method: 'POST',
            url: '/apiv1/cameras',
            payload,
            headers: { authorization: 'Bearer valid_token' },
        });

        httpResponseTest(t, response, 400)
    })

    t.test('PUT update camera with url', async (t) => {
        const payload = {
            id: dbCamera.id,
            name: dbCamera.name,
            url: dbCamera.url,
        };
        const response = await fastify.inject({
            method: 'PUT',
            url: '/apiv1/cameras',
            payload,
            headers: { authorization: 'Bearer valid_token' },
        });

        if (response.statusCode !== 201) {
            console.log('response', response.body)
        }

        httpResponseTest(t, response, 201)
        const responseJson = response.json()
        t.match(responseJson.id, dbCamera.id)
        t.match(responseJson.name, dbCamera.name)
        t.match(responseJson.url, dbCamera.url)
    })

    t.test('PUT update camera with host, should return 400', async (t) => {
        const payload = {
            id: testCameraSchema.id,
            name: testCameraSchema.name,
            frigateHostId: testCameraSchema.frigateHostId,
        };
        const response = await fastify.inject({
            method: 'PUT',
            url: '/apiv1/cameras',
            payload,
            headers: { authorization: 'Bearer valid_token' },
        });

        if (response.statusCode != 400) {
            console.log('response', response.body)
        }

        httpResponseTest(t, response, 400)
    });

    t.test('PUT add tag to camera', async (t) => {
        const response = await fastify.inject({
            method: 'PUT',
            url: `/apiv1/cameras/${dbCamera.id}/tag/${dbCamera.tagIds[0]}`,
            headers: { authorization: 'Bearer valid_token' },
        });

        httpResponseTest(t, response, 201)
        const cleanedCamera = cleanObjectByZodSchema(responseCameraStateSchema, dbCamera)
        matchWOTimeFields(t, response.json(), cleanedCamera)
    })


    t.test('DELETE camera', async (t) => {
        const response = await fastify.inject({
            method: 'DELETE',
            url: `/apiv1/cameras/${dbCamera.id}`,
            headers: { authorization: 'Bearer valid_token' },
        })

        httpResponseTest(t, response)
        const cleanedCamera = cleanObjectByZodSchema(responseCameraSchema, dbCamera)
        matchWOTimeFields(t, response.json(), cleanedCamera)
    })

    t.test('DELETE camera, by user, should return 403', async (t) => {
        jwtmock.restore()
        jwtmock = mockjJWTverify(userJWTResponse)
        const response = await fastify.inject({
            method: 'DELETE',
            url: `/apiv1/cameras/${dbCamera.id}`,
            headers: { authorization: 'Bearer valid_token' },
        })

        httpResponseTest(t, response, 403)
        t.match(response.json(), {"error":"Forbidden"})
    })

    t.test('DELETE tag from camera', async (t) => {
        const response = await fastify.inject({
            method: 'DELETE',
            url: `/apiv1/cameras/${dbCamera.id}/tag/${dbCamera.tagIds[0]}`,
            headers: { authorization: 'Bearer valid_token' },
        });

        httpResponseTest(t, response)
        const cleanedCamera = cleanObjectByZodSchema(responseCameraStateSchema, dbCamera)
        matchWOTimeFields(t, response.json(), cleanedCamera)
    })

    t.end()
})