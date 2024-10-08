# syntax=docker/dockerfile:1
# Build commands:
# - $VERSION=0.7
# - rm dist -r -Force ; yarn build
# - docker build --pull --rm -t oncharterliz/frigate-proxy:latest -t oncharterliz/frigate-proxy:$VERSION "."
# - docker image push oncharterliz/frigate-proxy:$VERSION ; docker image push oncharterliz/frigate-proxy:latest

FROM node:18-alpine AS frigate-proxy
ENV NODE_ENV=production
WORKDIR /app

COPY  package.json yarn.lock ./

RUN yarn install --production

COPY prisma ./prisma
RUN yarn prisma generate

COPY ./dist ./dist

CMD npx prisma db push && yarn prod
EXPOSE 4000