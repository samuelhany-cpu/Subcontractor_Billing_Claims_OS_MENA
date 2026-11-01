# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/telegram-gateway/package.json apps/telegram-gateway/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --filter @claims-os/telegram-gateway... --frozen-lockfile
COPY apps/telegram-gateway apps/telegram-gateway
COPY packages/config packages/config
RUN pnpm --filter @claims-os/telegram-gateway build \
  && pnpm --filter @claims-os/telegram-gateway deploy --legacy --prod /opt/telegram-gateway

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /opt/telegram-gateway ./
COPY apps/telegram-gateway/docker-entrypoint.sh /usr/local/bin/telegram-gateway-entrypoint
RUN chmod 0555 /usr/local/bin/telegram-gateway-entrypoint
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/telegram-gateway-entrypoint"]
CMD ["node", "dist/src/main.js"]
