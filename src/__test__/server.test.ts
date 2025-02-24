import { test } from 'tap';


import buildServer from '../server';
import { mockServices } from './mocked.services';
import sinon from 'sinon';


test('get `/healthcheck` route', async (t) => {
    mockServices()

    const fastify = buildServer()

    const response = await fastify.inject({
        method: "GET",
        url: '/healthcheck'
    })

    t.equal(response.statusCode, 200)
    t.same(response.json(), { status: "OK" })
    sinon.restore()
}) 