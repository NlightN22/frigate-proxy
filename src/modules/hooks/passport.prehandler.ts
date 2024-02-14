// import { ExtractJwt, Strategy, StrategyOptionsWithSecret } from "passport-jwt";
// import { OIDP } from "../../consts";
// import jwksRsa from "jwks-rsa";
// import fastifyPassport from '@fastify/passport'
// import { FastifyInstance } from "fastify";



// const clientJWT: StrategyOptionsWithSecret = {
//     jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//     secretOrKeyProvider: jwksRsa.passportJwtSecret({
//         cache: true,
//         rateLimit: true,
//         jwksRequestsPerMinute: 5,
//         jwksUri: `${OIDP.url.toString()}/protocol/openid-connect/certs`,
//     }),
//     issuer: OIDP.url.toString(),
//     algorithms: ['RS256']
// };

// export const setupPassportAuth = (server: FastifyInstance) => {

//     server.register(fastifyPassport.initialize())
//     server.register(fastifyPassport.secureSession())

//     fastifyPassport.use('jwt', new Strategy(clientJWT, (jwt_payload, done) => {
//         const user = { id: jwt_payload.sub, username: jwt_payload.username, roles: jwt_payload.roles }
//         return done(null, user)
//     }))
// }

// export const passportValidate = () => fastifyPassport.authenticate('jwt', {session: false})

