import { test } from 'tap'
import buildServer from '../server'
import { ImportMock } from 'ts-mock-imports'
import { FastifyInstance } from 'fastify';
import { mockServices } from './mocked.services';


test('get `/healthcheck` route', async (t) => {

    mockServices()

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