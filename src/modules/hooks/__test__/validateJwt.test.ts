import * as jwt from 'jsonwebtoken';
import sinon from 'sinon';
import { test } from 'tap';
import { mockServices } from '../../../__test__/mocked.services';
import { cleanAfterTest } from '../../../__test__/test.utils';
import buildServer from '../../../server';
import { validateJwt } from '../jwks-rsa.prehandler';

let lastRequest: any;

const mockedOIDPConfig = {
    clientId: 'testId',
    clientSecret: 'testSecret',
    clientUsername: 'testUsername',
    clientPassword: 'testPassword',
    clientURL: 'https://fake-oidc.com/',
}

test('validateJwt should pass with a valid token', async (t) => {
    const mocks = mockServices()

    mocks.configOIDPService?.getDecryptedOIDPConfig.resolves(mockedOIDPConfig)

    const fastify = buildServer();
    cleanAfterTest(fastify, t)


    const jwtVerifyStub = sinon.stub(jwt, 'verify').callsFake((token, key, options, callback) => {
        if (callback) {
            callback(null, {
                sub: '12345',
                name: 'Test User',
                realm_access: { roles: ['admin'] }
            });
        }
    });

    fastify.addHook('preValidation', validateJwt);

    const response = await fastify.inject({
        method: 'GET',
        url: '/test',
        headers: { authorization: 'Bearer valid_token' }
    });

    fastify.addHook('preHandler', async (request, reply) => {
        lastRequest = request;
    });

    t.equal(response.statusCode, 200, 'Should pass validation');

    t.ok(lastRequest?.user, 'User should be set in request');
    t.equal(lastRequest?.user?.id, '12345');
    t.equal(lastRequest?.user?.name, 'Test User');
    t.same(lastRequest?.user?.roles, ['admin']);

    jwtVerifyStub.restore();
});

// test('validateJwt should return 401 when token is missing', async (t) => {
//     const fastify = buildServer();

//     fastify.addHook('preValidation', validateJwt);

//     const response = await fastify.inject({
//         method: 'GET',
//         url: '/test',
//         headers: {} // 🔹 Без токена
//     });

//     t.equal(response.statusCode, 401, 'Should return 401 when no token is provided');
// });

// test('validateJwt should return 401 when token is invalid', async (t) => {
//     const fastify = Fastify();

//     // 🔹 Мокаем `jwt.verify`, чтобы выбрасывать ошибку
//     const jwtVerifyStub = sinon.stub(jwt, 'verify').callsFake((token, key, options, callback) => {
//         callback(new Error('Invalid token'), null);
//     });

//     fastify.addHook('preValidation', validateJwt);

//     const response = await fastify.inject({
//         method: 'GET',
//         url: '/test',
//         headers: { authorization: 'Bearer invalid_token' }
//     });

//     t.equal(response.statusCode, 401, 'Should return 401 when token is invalid');

//     jwtVerifyStub.restore();
// });
