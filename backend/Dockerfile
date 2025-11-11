FROM node:22-bookworm-slim as builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY --from=builder /usr/src/app/dist ./

CMD node ./src/index.js
