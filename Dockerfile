# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=21.7.3

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as build

# Below is copied from https://github.com/bfanger/multiplayer-dice-game/blob/main/Dockerfile
COPY . /app

RUN cd /app && npm install --legacy-peer-deps
RUN cd /app && npm run build
RUN cd /app && npm prune --production


FROM node:18-alpine

COPY --from=build /app/build/ /app/build
COPY --from=build /app/dist/ /app/dist
COPY --from=build /app/server.js /app/server.js
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json

CMD node /app/server.js
