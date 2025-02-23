import Fastify, { FastifyInstance } from 'fastify';
import { test } from 'tap';
import { mockServices } from '../../../__test__/mocked.services';

import { faker } from '@faker-js/faker';
import sinon from 'sinon';
import { cleanObjectByZodSchema, httpResponseTest } from '../../../__test__/test.utils';
import { cameraRoutes } from '../camera.route';
import { responseCameraSchema } from '../camera.schema';


const responseExample = {
    id: '65d0b991f6593bd703ff76ad',
    createAt: '2024-02-17T13:50:09.379Z',
    updateAt: '2024-02-17T13:50:09.379Z',
    name: 'Dr. Rudy Cummings PhD',
    state: null,
    url: 'https://hidden-reluctance.name/',
    frigateHost: {},
    roles: [],
    config: null,
    tags: [],
}


export const testCameraSchema = {
    tags: [{
        value: faker.commerce.productName(),
        id: faker.database.mongodbObjectId(),
        createAt: faker.date.anytime(),
        updateAt: faker.date.anytime(),
        userId: faker.database.mongodbObjectId(),
    }],
    url: faker.internet.url(),
    name: faker.person.fullName(),
    id: faker.database.mongodbObjectId(),
    createAt: faker.date.anytime(),
    updateAt: faker.date.anytime(),
    frigateHostId: faker.database.mongodbObjectId(),
    rolesIDs: [faker.database.mongodbObjectId()],
    state: faker.datatype.boolean(),
    config: faker.getMetadata() as Record<string, any>,
    tagIds: [faker.database.mongodbObjectId()],
}

async function postCamera(fastify: FastifyInstance) {
    return await fastify.inject({
        method: 'POST',
        url: '/apiv1/cameras',
        payload: {
            name: testCameraSchema.name,
            url: testCameraSchema.url,
        }
    })
}


test('Camera tests without database', t => {

    const fastify = Fastify()
    fastify.register(cameraRoutes, { prefix: 'apiv1/cameras' })

    // Hook to run before each test: create fresh mocks
    t.beforeEach(() => {
        const mocks = mockServices();
        mocks.camerasService?.getAllCameras.resolves([testCameraSchema])

    });

    // Hook to run after each test: restore stubbed functions
    t.afterEach(() => {
        sinon.restore()
    });

    t.test(' GET cameras - get cameras from mock', async (t) => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/apiv1/cameras',
        })

        if (response.statusCode !== 200) {
            console.log('response', response.body)
        }

        httpResponseTest(t, response)

        const jsonResponse = response.json()
        const cleanedTestCameraSchema = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema);
        t.match(jsonResponse, [cleanedTestCameraSchema])

        t.end()

    })

    t.end()
})

