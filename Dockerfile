FROM node:16.17.0-alpine3.15

WORKDIR /app

COPY package.json ./
COPY socketServer.js ./
COPY .env ./

WORKDIR /app/functions
COPY functions/*.js ./

WORKDIR /app/class
COPY class/*.js ./

WORKDIR /app
RUN npm install --omit=dev && npm cache clean --force
CMD node --max-old-space-size=4096 --optimize_for_size --gc_interval=100 /app/socketServer.js
