FROM node:22-alpine

WORKDIR /webmixer

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

RUN npm ci

COPY . .

RUN npm run build:web

RUN npm prune --omit=dev

ENTRYPOINT [ "node", "." ]
