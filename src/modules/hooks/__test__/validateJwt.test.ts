import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import sinon from 'sinon';
import { test } from 'tap';
import { mockServices } from '../../../__test__/mocked.services';
import * as jwt from 'jsonwebtoken';
import { validateJwt } from '../jwks-rsa.prehandler';

const mockedOIDPConfig = {
    clientId: 'testId',
    clientSecret: 'testSecret',
    clientUsername: 'testUsername',
    clientPassword: 'testPassword',
    clientURL: 'https://fake-oidc.com/',
}

const testJWTResponse = {
    sub: '12345',
    name: 'Test User',
    realm_access: { roles: ['admin'] }
}

let lastRequest: FastifyRequest;

const createTestServer = (): FastifyInstance => {
    const fastify = Fastify();

    fastify.addHook('preValidation', async (request, reply) => {
        await validateJwt(request, reply);
        lastRequest = request;
    });

    fastify.get('/test', async (req: FastifyRequest, rep: FastifyReply) => {
        return { message: 'Test route works' };
    });

    return fastify;
};

test('validateJwt tests', t => {

    const fastify = createTestServer()

    // Hook to run before each test: create fresh mocks
    t.beforeEach(() => {
        const mocks = mockServices();
        mocks.configOIDPService?.getDecryptedOIDPConfig.resolves(mockedOIDPConfig);
    });

    // Hook to run after each test: restore stubbed functions
    t.afterEach(() => {
        sinon.restore()
    });


    t.test('should pass with a valid token', async (t) => {

        // Import jsonwebtoken using require to allow stubbing
        const jwt = require('jsonwebtoken');

        sinon.stub(jwt, 'verify').callsFake((
            token: string,
            secretOrPublicKey: jwt.Secret | jwt.GetPublicKeyOrSecret,
            options: jwt.VerifyOptions | undefined,
            callback?: jwt.VerifyCallback
        ) => {
            if (typeof callback === 'function') {
                callback(null, {
                    sub: testJWTResponse.sub,
                    name: testJWTResponse.name,
                    realm_access: testJWTResponse.realm_access
                });
            }
        });

        const response = await fastify.inject({
            method: 'GET',
            url: '/test',
            headers: { authorization: 'Bearer valid_token' }
        });

        t.equal(response.statusCode, 200, 'Should pass validation');
        console.log('lastRequest?.user', lastRequest?.user)
        t.ok(lastRequest?.user, 'User should be set in request');
        t.equal(lastRequest?.user?.id, testJWTResponse.sub);
        t.equal(lastRequest?.user?.name, testJWTResponse.name);
        t.same(lastRequest?.user?.roles, testJWTResponse.realm_access.roles);

        t.end()
    });

    t.test('should return 401 when token is missing', async (t) => {
        const fastify = createTestServer();

        const response = await fastify.inject({
            method: 'GET',
            url: '/test',
            headers: {} // No Authorization header
        });

        t.equal(response.statusCode, 401, 'Should return 401 when no token is provided');
        t.end()
    });

    t.test('should return 401 when token is invalid', async (t) => {
        const fastify = createTestServer();

        // Import jsonwebtoken using require to allow stubbing
        const jwt = require('jsonwebtoken');

        const jwtStub = sinon.stub(jwt, 'verify').callsFake((
            token: string,
            key: jwt.Secret | jwt.GetPublicKeyOrSecret,
            options: jwt.VerifyOptions | undefined,
            callback?: jwt.VerifyCallback
        ) => {
            if (typeof callback === 'function') {
                // Using JsonWebTokenError to satisfy the expected error type
                callback(new jwt.JsonWebTokenError('Invalid token'), undefined);
            }
        });

        const response = await fastify.inject({
            method: 'GET',
            url: '/test',
            headers: { authorization: 'Bearer invalid_token' }
        });

        t.equal(response.statusCode, 401, 'Should return 401 when token is invalid');

        jwtStub.restore();
        t.end()
    });

    t.end()
})




