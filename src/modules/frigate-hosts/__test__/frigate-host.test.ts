import { FastifyInstance } from 'fastify';
import sinon from 'sinon';
import t from 'tap';
import { mockServices } from '../../../__test__/mocked.services';
import { testFriagteHostFormatted, testFrigateHostSchema } from '../../../__test__/test.schemas';
import { cleanAfterTest, httpResponseTest } from '../../../__test__/test.utils';
import buildServer from '../../../server';
import FrigateHostUpdates from '../frigate-host.updates';
import { logger } from '../../../utils/logger';
import prisma from '../../../utils/prisma';

async function createHost(fastify: FastifyInstance) {
    const createResponse = await fastify.inject({
        method: 'PUT',
        url: '/apiv1/frigate-hosts',
        payload: [
            {
                id: testFrigateHostSchema.id,
                name: testFrigateHostSchema.name,
                host: testFrigateHostSchema.host,
                enabled: testFrigateHostSchema.enabled
            }
        ]
    })
    httpResponseTest(t, createResponse, 201)
    return createResponse.json()
}

let hostData
let fastify: FastifyInstance

t.before(() => {
    mockServices(['frigateHostsService'])
    sinon.stub(FrigateHostUpdates, 'initialize')
    fastify = buildServer()
    cleanAfterTest(fastify, t)
})

t.beforeEach(async (t) => {
    await prisma.frigateHost.deleteMany({})
    hostData = await createHost(fastify)
})

t.test('PUT host - create host with test database', async (t) => {
    t.equal(hostData[0].name, testFriagteHostFormatted.name)
    t.equal(hostData[0].host, testFriagteHostFormatted.host)
    t.equal(hostData[0].enabled, testFriagteHostFormatted.enabled)
})


t.test('GET host - create host and get hosts', async (t) => {
    const getResponse = await fastify.inject({
        method: 'GET',
        url: `/apiv1/frigate-hosts`,
    })

    httpResponseTest(t, getResponse, 200)

    const json = getResponse.json()
    logger.debug(`JSON: ${JSON.stringify(json)}`)

    t.match(json, hostData)
})

t.test('GET host - create host and get host by id', async (t) => {
    const getResponse = await fastify.inject({
        method: 'GET',
        url: `/apiv1/frigate-hosts/${hostData[0].id}`,
    })

    httpResponseTest(t, getResponse, 200)

    const json = getResponse.json()
    logger.debug(`JSON: ${JSON.stringify(json)}`)

    t.match(json, hostData[0])
})

t.test(' PUT host by id - create host by PUT and edit by ID with test database', async (t) => {
    t.equal(hostData[0].name, testFriagteHostFormatted.name)
    t.equal(hostData[0].host, testFriagteHostFormatted.host)
    t.equal(hostData[0].enabled, testFriagteHostFormatted.enabled)

    const editedHost = {
        ...hostData[0],
        enabled: false
    }

    const editResponse = await fastify.inject({
        method: 'PUT',
        url: `/apiv1/frigate-hosts/${editedHost.id}`,
        payload: 
            {
                id: editedHost.id,
                name: editedHost.name,
                host: editedHost.host,
                enabled: editedHost.enabled
            }
    })

    httpResponseTest(t, editResponse, 201)

    const json = editResponse.json()

    t.equal(json.name, editedHost.name)
    t.equal(json.host, editedHost.host)
    t.equal(json.enabled, editedHost.enabled)
})

t.test(' DEL hosts - create host by PUT and DEL from DB with test database', async (t) => {
    t.equal(hostData[0].name, testFriagteHostFormatted.name)
    t.equal(hostData[0].host, testFriagteHostFormatted.host)
    t.equal(hostData[0].enabled, testFriagteHostFormatted.enabled)


    const delResponse = await fastify.inject({
        method: 'PUT',
        url: `/apiv1/frigate-hosts`,
        payload:
            [
                {
                    id: hostData[0].id,
                    name: hostData[0].name,
                    host: hostData[0].host,
                    enabled: hostData[0].enabled
                }
            ]
    })

    httpResponseTest(t, delResponse, 201)

    const json = delResponse.json()

    t.equal(json[0].name, hostData[0].name)
    t.equal(json[0].host, hostData[0].host)
    t.equal(json[0].enabled, hostData[0].enabled)
})

t.test(' DEL host by id - create host by PUT and DEL from DB with test database', async (t) => {
    t.equal(hostData[0].name, testFriagteHostFormatted.name)
    t.equal(hostData[0].host, testFriagteHostFormatted.host)
    t.equal(hostData[0].enabled, testFriagteHostFormatted.enabled)


    const delResponse = await fastify.inject({
        method: 'PUT',
        url: `/apiv1/frigate-hosts/${hostData[0].id}`,
        payload:
        {
            id: hostData[0].id,
            name: hostData[0].name,
            host: hostData[0].host,
            enabled: hostData[0].enabled
        }
    })

    httpResponseTest(t, delResponse, 201)

    const json = delResponse.json()

    t.equal(json.name, hostData[0].name)
    t.equal(json.host, hostData[0].host)
    t.equal(json.enabled, hostData[0].enabled)
})

