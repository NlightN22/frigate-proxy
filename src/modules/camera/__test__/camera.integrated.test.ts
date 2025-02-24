import { FastifyInstance, LightMyRequestResponse } from "fastify";
import { mockServices } from "../../../__test__/mocked.services";
import { cleanFromReferencesIds, cleanObjectByZodSchema, httpResponseTest, matchWOTimeFields, sameObjectsFieldsTest } from "../../../__test__/test.utils";
import buildServer from "../../../server";
import prisma from "../../../utils/prisma";
import { responseCameraSchema } from "../camera.schema";
import { faker } from '@faker-js/faker';
import { test } from "tap";
import { Camera } from "@prisma/client";
import { responseCameraStateSchema } from "../camera.core.schema";

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

test('Camera integrated tests', t => {
    let fastify: FastifyInstance

    t.before(() => {
        const mocks = mockServices(['camerasService'])
        fastify = buildServer()
    })

    t.beforeEach(async (t) => {
        await prisma.camera.create({
            data: dbCamera
        })
    })

    t.afterEach(async (t) => {
        await prisma.camera.deleteMany({})
    })

    t.test('POST create camera', async (t) => {
        const postCameraResponse = await fastify.inject({
            method: 'POST',
            url: '/apiv1/cameras',
            payload: {
                name: testCameraSchema.name,
                url: testCameraSchema.url,
            }
        })
        const postCameraResponseJson = postCameraResponse.json()
        httpResponseTest(t, postCameraResponse, 201)
        t.equal(postCameraResponseJson.name, testCameraSchema.name)
        t.equal(postCameraResponseJson.url, testCameraSchema.url)
        const cleanedCameraResponse = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema)
        sameObjectsFieldsTest(t, postCameraResponseJson, cleanedCameraResponse)
    })

    t.test('GET cameras', async (t) => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/apiv1/cameras',
        })

        httpResponseTest(t, response)
        const firstElement = response.json()[0]
        const cleanedCamera = cleanObjectByZodSchema(responseCameraSchema, dbCamera)
        matchWOTimeFields(t, firstElement, cleanedCamera)
    })

    t.test('GET camera by id', async (t) => {
        const response = await fastify.inject({
            method: 'GET',
            url: `/apiv1/cameras/${dbCamera.id}`,
        })

        httpResponseTest(t, response)
        const cleanedCamera = cleanObjectByZodSchema(responseCameraSchema, dbCamera)
        matchWOTimeFields(t, response.json(), cleanedCamera)
    })

    t.test('GET cameras by host id', async (t) => {
        const response = await fastify.inject({
            method: 'GET',
            url: `/apiv1/cameras/host/${dbCamera.frigateHostId}`
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
        });

        httpResponseTest(t, response, 201)
        const cleanedCamera = cleanObjectByZodSchema(responseCameraStateSchema, dbCamera)
        matchWOTimeFields(t, response.json(), cleanedCamera)
    })


    // t.test('DELETE camera', async (t) => {
        
    // })

    // t.test('DELETE tag from camera', async (t) => {
    // })

    t.end()
})


// test(' POST camera - create camera with test DB', async (t) => {
//     mockServices(['camerasService'])
//     const fastify = Fastify

//     cleanAfterTest(fastify, t)

//     const createResponse = await postCamera(fastify)

//     httpResponseTest(t, createResponse, 201)

//     const json = createResponse.json()

//     t.equal(json.name, testCameraSchema.name)
//     t.equal(json.url, testCameraSchema.url)
// })

// test(' GET cameras - create by POST and get cameras from DB', async (t) => {
//     mockServices(['camerasService'])
//     const fastify = buildServer()

//     cleanAfterTest(fastify, t)

//     const createResponse = await postCamera(fastify)

//     const jsonCreate = createResponse.json()
//     t.equal(jsonCreate.name, testCameraSchema.name)
//     t.equal(jsonCreate.url, testCameraSchema.url)

//     const response = await fastify.inject({
//         method: 'GET',
//         url: '/apiv1/cameras',
//     })

//     httpResponseTest(t, response)

//     const jsonGet = response.json()
//     t.equal(jsonGet[0].name, testCameraSchema.name)
//     t.equal(jsonGet[0].url, testCameraSchema.url)
// })
// test(' GET camera - create by POST and get camera from DB', async (t) => {
//     mockServices(['camerasService'])
//     const fastify = buildServer()

//     cleanAfterTest(fastify, t)

//     const createResponse = await postCamera(fastify)

//     const jsonCreate = createResponse.json()
//     t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
//     t.equal(jsonCreate.name, testCameraSchema.name)
//     t.equal(jsonCreate.url, testCameraSchema.url)

//     const id = jsonCreate.id

//     const response = await fastify.inject({
//         method: 'GET',
//         url: `/apiv1/cameras/${id}`,
//     })

//     httpResponseTest(t, response)

//     const jsonGet = response.json()
//     t.match(jsonGet, jsonCreate)
// })
// test(' PUT camera - create by POST and PUT changes to DB', async (t) => {
//     mockServices(['camerasService'])
//     const fastify = buildServer()

//     cleanAfterTest(fastify, t)

//     const createResponse = await postCamera(fastify)

//     const jsonCreate = createResponse.json()
//     t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
//     t.equal(jsonCreate.name, testCameraSchema.name)
//     t.equal(jsonCreate.url, testCameraSchema.url)

//     const { id, name, url } = jsonCreate

//     const response = await fastify.inject({
//         method: 'PUT',
//         url: `/apiv1/cameras/`,
//         payload: { id, name, url }
//     })

//     httpResponseTest(t, response, 201)

//     const jsonGet = response.json()
//     const jsonGetWithoutupdatedAt = removeProperty(jsonGet, 'updatedAt')
//     const jsonCreateWithoutupdatedAt = removeProperty(jsonCreate, 'updatedAt')
//     t.matchOnly(jsonGetWithoutupdatedAt, jsonCreateWithoutupdatedAt)
// })
// test(' DEL camera - create by POST and DEL from DB', async (t) => {
//     mockServices(['camerasService'])
//     const fastify = buildServer()

//     cleanAfterTest(fastify, t)

//     const createResponse = await postCamera(fastify)

//     const jsonCreate = createResponse.json()
//     t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
//     t.equal(jsonCreate.name, testCameraSchema.name)
//     t.equal(jsonCreate.url, testCameraSchema.url)

//     const response = await fastify.inject({
//         method: 'DELETE',
//         url: `/apiv1/cameras/${jsonCreate.id}`,
//     })

//     httpResponseTest(t, response)

//     const jsonDelete = response.json()

//     const jsonGetWithoutupdatedAt = removeProperty(jsonDelete, 'updatedAt')
//     const jsonCreateWithoutupdatedAt = removeProperty(jsonCreate, 'updatedAt')
//     t.matchOnly(jsonGetWithoutupdatedAt, jsonCreateWithoutupdatedAt)
// })