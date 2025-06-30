FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

RUN npm test -- --verbose

RUN npm prune --production

FROM node:18-alpine

WORKDIR /usr/src/app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /usr/src/app/build ./build
COPY --from=builder --chown=appuser:appgroup /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /usr/src/app/package.json .

RUN mkdir -p /usr/src/app/logs && chown -R appuser:appgroup /usr/src/app/logs

USER appuser

ENV ENABLE_HTTP_TRANSPORT=false
ENV MCP_SSE_PORT=3001

EXPOSE 3001

CMD ["npm", "start"]
