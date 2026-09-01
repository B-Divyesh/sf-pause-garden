FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/game.ts src/game.ts
COPY server server
RUN npm run build:server

FROM node:22-slim AS runtime
ARG BUILD_SHA=dev
ENV NODE_ENV=production
ENV PORT=8080
ENV BUILD_SHA=${BUILD_SHA}
WORKDIR /app
RUN addgroup --system garden && adduser --system --ingroup garden garden && mkdir -p /data && chown garden:garden /data
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/server-dist ./server-dist
USER garden
EXPOSE 8080
CMD ["node", "server-dist/server/index.js"]
