import { FastifyInstance, FastifyRequest } from "fastify";
import acceptLanguageParser from 'accept-language-parser'
import i18n from "../translate/i18n.conf";


export function selectLanguageHook(fastify: FastifyInstance) {
  fastify.addHook('preHandler', (request, reply, done) => {
    const acceptLanguage = request.headers['accept-language'];
    const languages = acceptLanguageParser.parse(acceptLanguage);
    const bestMatch = languages.length > 0 ? languages[0].code : 'en';
    i18n.changeLanguage(bestMatch);
    done();
  });
}

export function selectLanguageRequest(request: FastifyRequest) {
  const acceptLanguage = request.headers['accept-language'];
  const languages = acceptLanguageParser.parse(acceptLanguage);
  const bestMatch = languages.length > 0 ? languages[0].code : 'en';
  i18n.changeLanguage(bestMatch);
}