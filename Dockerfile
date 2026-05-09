ARG NODE_ENV=development
ARG BUILD_VERSION=unknown
ARG NODE_VERSION=20-slim

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci --only=production && \
    npm ci --only=development

COPY src ./src
COPY generator ./generator

RUN npm run build

FROM node:${NODE_VERSION}

WORKDIR /app

RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force
COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api', (r) => {if (r.statusCode !== 404) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
