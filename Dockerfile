FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

FROM node:18-alpine

WORKDIR /usr/src/app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /usr/src/app/build ./build
COPY --from=builder --chown=appuser:appgroup /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /usr/src/app/package.json .

RUN mkdir -p /usr/src/app/logs && chown -R appuser:appgroup /usr/src/app/logs

USER appuser

ENV ENABLE_HTTP_TRANSPORT=true
ENV MCP_HTTP_PORT=3001
ENV MCP_HTTP_ENDPOINT=/mcp

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" || exit 1

CMD ["npm", "start"]
