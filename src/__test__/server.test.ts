import { test } from 'tap'
import buildServer from '../server'
import { ImportMock } from 'ts-mock-imports'
import { FastifyInstance } from 'fastify';
import * as FrigateHostsModule from '../modules/frigate-hosts/frigate-hosts.service';
import * as CamerasModule from '../modules/camera/camera.service';
import * as RolesModule from '../modules/roles/roles.service';
import * as OIDPModule from '../modules/auth/oidp.service';

test('get `/healthcheck` route', async (t) => {

    const hostServiceStub = ImportMock.mockClass(FrigateHostsModule, 'default')
    const cameraServiceStub = ImportMock.mockClass(CamerasModule, 'default')
    const rolesServiceStub = ImportMock.mockClass(RolesModule, 'default')
    const oidpServiceStub = ImportMock.mockClass(OIDPModule, 'default')
    
    t.teardown(() => {
        fastify.close()
        ImportMock.restore()
    })

    const fastify = buildServer()

    const response = await fastify.inject({
        method: "GET",
        url: '/healthcheck'
    })

    t.equal(response.statusCode, 200)
    t.same(response.json(), { status: "OK" })
}) 