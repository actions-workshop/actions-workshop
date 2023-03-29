# Build container for the frontend bundle
FROM node:16 as build

WORKDIR /usr/src/app

COPY . .

RUN npm ci
RUN npm run build:staging

# Create the server to host the static files
FROM node:16 as server

WORKDIR /usr/src/app

COPY ./server/package*.json ./
RUN npm ci --omit=dev

# Create the final image to host both, server and distribute files as public
FROM node:lts-alpine

ENV NODE_ENV production
USER node

WORKDIR /usr/src/app
COPY --chown=node:node --from=server /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node --from=server /usr/src/app/package*.json /usr/src/app/
COPY --chown=node:node --from=build  /usr/src/app/dist /usr/src/app/public/

EXPOSE 8080
CMD [ "npx", "http-server", "public", "-p", "8080" ]
