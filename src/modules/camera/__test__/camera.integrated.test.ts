import { FastifyInstance } from "fastify";
import { testCameraSchema } from "./camera.test";


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

// test('Camera tests with database', t => {



//     t.end()
// })


// test(' POST camera - create camera with test DB', async (t) => {
//     mockServices(['camerasService'])
//     const fastify = Fastify

//     cleanAfterTest(fastify, t)

//     const createResponse = await postCamera(fastify)

//     httpResponseTest(t, createResponse, 201)

//     const json = createResponse.json()

//     t.equal(json.name, testCameraSchema.name)
//     t.equal(json.url, testCameraSchema.url)
// })

// test(' GET cameras - create by POST and get cameras from DB', async (t) => {
//     mockServices(['camerasService'])
//     const fastify = buildServer()

//     cleanAfterTest(fastify, t)

//     const createResponse = await postCamera(fastify)

//     const jsonCreate = createResponse.json()
//     t.equal(jsonCreate.name, testCameraSchema.name)
//     t.equal(jsonCreate.url, testCameraSchema.url)

//     const response = await fastify.inject({
//         method: 'GET',
//         url: '/apiv1/cameras',
//     })

//     httpResponseTest(t, response)

//     const jsonGet = response.json()
//     t.equal(jsonGet[0].name, testCameraSchema.name)
//     t.equal(jsonGet[0].url, testCameraSchema.url)
// })
// test(' GET camera - create by POST and get camera from DB', async (t) => {
//     mockServices(['camerasService'])
//     const fastify = buildServer()

//     cleanAfterTest(fastify, t)

//     const createResponse = await postCamera(fastify)

//     const jsonCreate = createResponse.json()
//     t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
//     t.equal(jsonCreate.name, testCameraSchema.name)
//     t.equal(jsonCreate.url, testCameraSchema.url)

//     const id = jsonCreate.id

//     const response = await fastify.inject({
//         method: 'GET',
//         url: `/apiv1/cameras/${id}`,
//     })

//     httpResponseTest(t, response)

//     const jsonGet = response.json()
//     t.match(jsonGet, jsonCreate)
// })
// test(' PUT camera - create by POST and PUT changes to DB', async (t) => {
//     mockServices(['camerasService'])
//     const fastify = buildServer()

//     cleanAfterTest(fastify, t)

//     const createResponse = await postCamera(fastify)

//     const jsonCreate = createResponse.json()
//     t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
//     t.equal(jsonCreate.name, testCameraSchema.name)
//     t.equal(jsonCreate.url, testCameraSchema.url)

//     const { id, name, url } = jsonCreate

//     const response = await fastify.inject({
//         method: 'PUT',
//         url: `/apiv1/cameras/`,
//         payload: { id, name, url }
//     })

//     httpResponseTest(t, response, 201)

//     const jsonGet = response.json()
//     const jsonGetWithoutUpdateAt = removeProperty(jsonGet, 'updateAt')
//     const jsonCreateWithoutUpdateAt = removeProperty(jsonCreate, 'updateAt')
//     t.matchOnly(jsonGetWithoutUpdateAt, jsonCreateWithoutUpdateAt)
// })
// test(' DEL camera - create by POST and DEL from DB', async (t) => {
//     mockServices(['camerasService'])
//     const fastify = buildServer()

//     cleanAfterTest(fastify, t)

//     const createResponse = await postCamera(fastify)

//     const jsonCreate = createResponse.json()
//     t.hasOwnPropsOnly(jsonCreate, Object.getOwnPropertyNames(responseExample))
//     t.equal(jsonCreate.name, testCameraSchema.name)
//     t.equal(jsonCreate.url, testCameraSchema.url)

//     const response = await fastify.inject({
//         method: 'DELETE',
//         url: `/apiv1/cameras/${jsonCreate.id}`,
//     })

//     httpResponseTest(t, response)

//     const jsonDelete = response.json()

//     const jsonGetWithoutUpdateAt = removeProperty(jsonDelete, 'updateAt')
//     const jsonCreateWithoutUpdateAt = removeProperty(jsonCreate, 'updateAt')
//     t.matchOnly(jsonGetWithoutUpdateAt, jsonCreateWithoutUpdateAt)
// })