import { FastifyReply, FastifyRequest } from 'fastify';
import sinon, { SinonStub } from 'sinon';
import { test } from 'tap';

import { mockServices } from '../../../__test__/mocked.services';

import { ErrorApp } from '../error.handler';
import { validateAdminRole } from '../validate.admin.role';

const adminRole = {
    id: '1234',
    key: '124235',
    value: 'admin',
    encrypted: false,
    description: 'Admin Role',
}

const mockedOIDPConfig = {
    clientId: 'testId',
    clientSecret: 'testSecret',
    clientUsername: 'testUsername',
    clientPassword: 'testPassword',
    clientURL: 'https://fake-oidc.com/',
}

test('validateAdminRole tests', t => {

    // Hook to run before each test: create fresh mocks
    t.beforeEach(() => {
        const mocks = mockServices();
        mocks.configOIDPService?.getDecryptedOIDPConfig.resolves(mockedOIDPConfig);
        mocks.configService?.getAdminRole.resolves(adminRole);
    });

    // Hook to run after each test: restore stubbed functions
    t.afterEach(() => {
        sinon.restore()
    });

    t.test('should pass when user has admin role', async (t) => {

        const fakeRequest = { user: { roles: ['user', 'admin'] } } as FastifyRequest;
        const fakeReply = {
            code: sinon.stub().returnsThis(),
            send: sinon.stub()
        } as unknown as FastifyReply;

        await validateAdminRole(fakeRequest, fakeReply);
        t.notOk((fakeReply.send as SinonStub).called, 'Reply.send should not be called when user has admin role');
        t.end();
    });

    t.test('should throw error when user is not provided', async (t) => {

        const fakeRequest = {} as FastifyRequest;
        const fakeReply = {
            code: sinon.stub().returnsThis(),
            send: sinon.stub()
        } as unknown as FastifyReply;

        try {
            await validateAdminRole(fakeRequest, fakeReply);
            t.fail('Should have thrown error for missing user');
        } catch (err: any) {
            t.type(err, ErrorApp, 'Error should be instance of ErrorApp');
            t.equal(err.message, 'User not provided to request');
        }
        t.end();
    });

    t.test('should throw error when roles are not provided', async (t) => {
        const fakeRequest = { user: {} } as FastifyRequest;
        const fakeReply = {
            code: sinon.stub().returnsThis(),
            send: sinon.stub()
        } as unknown as FastifyReply;

        try {
            await validateAdminRole(fakeRequest, fakeReply);
            t.fail('Should have thrown error for missing roles');
        } catch (err: any) {
            t.type(err, ErrorApp, 'Error should be instance of ErrorApp');
            t.equal(err.message, 'Roles not provided to request');
        }
        t.end();
    });

    t.test('should return 403 when user does not have admin role', async (t) => {
        const fakeRequest = { user: { roles: ['user'] } } as FastifyRequest;
        const fakeReply = {
            code: sinon.stub().returnsThis(),
            send: sinon.stub()
        } as unknown as FastifyReply;

        await validateAdminRole(fakeRequest, fakeReply);

        t.ok((fakeReply.code as SinonStub).calledWith(403), 'Reply.code should be called with 403');
        t.ok((fakeReply.send as SinonStub).calledWith({ error: 'Forbidden' }), 'Reply.send should be called with Forbidden error');
        t.end();
    });
    t.end()
})








