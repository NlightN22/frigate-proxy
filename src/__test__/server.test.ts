import { test } from 'tap';

mockServices()

import buildServer from '../server';
import { mockServices } from './mocked.services';


test('get `/healthcheck` route', async (t) => {

    // TODO add restore mocks
    
    const fastify = buildServer()

    const response = await fastify.inject({
        method: "GET",
        url: '/healthcheck'
    })

    t.equal(response.statusCode, 200)
    t.same(response.json(), { status: "OK" })
}) 