import Fastify, { FastifyInstance } from 'fastify';
import { test } from 'tap';
import { mockServices } from '../../../__test__/mocked.services';
import sinon from 'sinon';
import { cleanObjectByZodSchema, httpResponseTest } from '../../../__test__/test.utils';
import { responseCameraStateSchema } from '../camera.core.schema';
import { cameraRoutes } from '../camera.route';
import { responseCameraSchema } from '../camera.schema';
import { faker } from '@faker-js/faker';

const testCameraSchema = {
    tags: [{
        value: faker.commerce.productName(),
        id: faker.database.mongodbObjectId(),
        createdAt: faker.date.anytime(),
        updatedAt: faker.date.anytime(),
        userId: faker.database.mongodbObjectId(),
    }],
    url: faker.internet.url(),
    name: faker.person.fullName(),
    id: faker.database.mongodbObjectId(),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
    frigateHostId: faker.database.mongodbObjectId(),
    rolesIDs: [faker.database.mongodbObjectId()],
    state: faker.datatype.boolean(),
    config: faker.getMetadata() as Record<string, any>,
    tagIds: [faker.database.mongodbObjectId()],
}

test('Camera tests', t => {

    let fastify: FastifyInstance

    // Hook to run before each test: create fresh mocks
    t.beforeEach(() => {
        const mocks = mockServices();
        mocks.camerasService?.getAllCameras.resolves([testCameraSchema])
        mocks.camerasService?.getCamera.resolves(testCameraSchema);
        mocks.camerasService?.createCamera.resolves(testCameraSchema);
        mocks.camerasService?.editCamera.resolves(testCameraSchema);
        mocks.camerasService?.addTagToCamera.resolves(testCameraSchema);
        mocks.camerasService?.deleteCamera.resolves(testCameraSchema);
        mocks.camerasService?.deleteTagFromCamera.resolves(testCameraSchema);
        mocks.camerasService?.getCameraState.resolves(testCameraSchema);

        fastify = Fastify()
        fastify.register(cameraRoutes, { prefix: 'apiv1/cameras' })
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

        httpResponseTest(t, response)

        const jsonResponse = response.json()
        const cleanedTestCameraSchema = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema);
        t.match(jsonResponse, [cleanedTestCameraSchema])

        t.end()
    })

    t.test('GET camera by id', async (t) => {
        // Send GET request to retrieve camera by ID
        const response = await fastify.inject({
            method: 'GET',
            url: `/apiv1/cameras/${testCameraSchema.id}`,
        });

        httpResponseTest(t, response);
        const jsonResponse = response.json();
        const cleanedTestCamera = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema);
        t.match(jsonResponse, cleanedTestCamera);
        t.end();
    });

    t.test('GET cameras by host id', async (t) => {
        // Send GET request with query parameters for pagination
        const response = await fastify.inject({
            method: 'GET',
            url: `/apiv1/cameras/host/${testCameraSchema.frigateHostId}?offset=0&limit=10`,
        });


        httpResponseTest(t, response);
        const jsonResponse = response.json();
        t.ok(Array.isArray(jsonResponse));
        const cleanedTestCamera = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema);
        t.match(jsonResponse, [cleanedTestCamera]);
        t.end();
    });

    t.test('GET camera state', async (t) => {
        // Send GET request to retrieve camera state (unauthenticated)
        const response = await fastify.inject({
            method: 'GET',
            url: `/apiv1/cameras/${testCameraSchema.id}/state`,
        });

        httpResponseTest(t, response);
        const jsonResponse = response.json();
        const cleanedCameraState = cleanObjectByZodSchema(responseCameraStateSchema, testCameraSchema)
        t.match(jsonResponse, cleanedCameraState);
        t.end();
    });

    t.test('POST create camera', async (t) => {
        // Prepare payload according to createCameraSchema
        const payload = {
            url: testCameraSchema.url,
            name: testCameraSchema.name,
            frigateHostId: testCameraSchema.frigateHostId,
            config: testCameraSchema.config,
        };
        const response = await fastify.inject({
            method: 'POST',
            url: '/apiv1/cameras',
            payload,
        });


        httpResponseTest(t, response, 201)
        const jsonResponse = response.json();
        const cleanedTestCamera = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema);
        t.match(jsonResponse, cleanedTestCamera);
        t.end();
    });

    t.test('POST create camera. Should return 400', async (t) => {
        // Prepare payload according to createCameraSchema
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
        t.end();
    });

    t.test('PUT update camera with url', async (t) => {
        const payload = {
            id: testCameraSchema.id,
            name: testCameraSchema.name,
            url: testCameraSchema.url,
        };
        const response = await fastify.inject({
            method: 'PUT',
            url: '/apiv1/cameras',
            payload,
        });

        httpResponseTest(t, response, 201)
        const jsonResponse = response.json();
        const cleanedTestCamera = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema);
        t.match(jsonResponse, cleanedTestCamera);
        t.end();
    });

    t.test('PUT update camera without url, should return 400', async (t) => {
        const payload = {
            id: testCameraSchema.id,
            name: testCameraSchema.name,
        };
        const response = await fastify.inject({
            method: 'PUT',
            url: '/apiv1/cameras',
            payload,
        });

        httpResponseTest(t, response, 400)
        t.end();
    });

    t.test('PUT add tag to camera', async (t) => {
        const response = await fastify.inject({
            method: 'PUT',
            url: `/apiv1/cameras/${testCameraSchema.id}/tag/${testCameraSchema.tagIds[0]}`,
        });

        httpResponseTest(t, response, 201)
        const jsonResponse = response.json();
        const cleanedTestCamera = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema);
        t.match(jsonResponse, cleanedTestCamera);
        t.end();
    });

    t.test('DELETE camera', async (t) => {
        // Send DELETE request to remove a camera
        const response = await fastify.inject({
            method: 'DELETE',
            url: `/apiv1/cameras/${testCameraSchema.id}`,
            // Admin authentication headers can be added here
        });

        httpResponseTest(t, response);
        const jsonResponse = response.json();
        const cleanedTestCamera = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema);
        t.match(jsonResponse, cleanedTestCamera);
        t.end();
    });

    t.test('DELETE tag from camera', async (t) => {
        // Send DELETE request to remove a tag from a camera
        const response = await fastify.inject({
            method: 'DELETE',
            url: `/apiv1/cameras/${testCameraSchema.id}/tag/${testCameraSchema.tagIds[0]}`,
            // Admin authentication headers can be added here
        });

        httpResponseTest(t, response);
        const jsonResponse = response.json();
        const cleanedTestCamera = cleanObjectByZodSchema(responseCameraSchema, testCameraSchema);
        t.match(jsonResponse, cleanedTestCamera);
        t.end();
    });


    t.end()
})

