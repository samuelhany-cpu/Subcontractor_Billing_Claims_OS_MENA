# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apt-get update \
    && apt-get install --no-install-recommends -y openssl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@10.19.0 --activate

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN pnpm --filter @claims-os/domain build && pnpm --filter @claims-os/api build

FROM build AS deploy
RUN pnpm --filter @claims-os/api deploy --legacy --prod /opt/claims-os-api \
    && cd /opt/claims-os-api \
    && DATABASE_URL=postgresql://localhost:5432/prisma_generate node_modules/.bin/prisma generate --schema prisma/schema.prisma

# The migration job has the same production dependency closure as the API and
# deliberately runs only `prisma migrate deploy`; it never resets persistent
# data or carries the builder's development dependency tree.
FROM deploy AS migration
WORKDIR /opt/claims-os-api
USER node
CMD ["node_modules/.bin/prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
    && apt-get install --no-install-recommends -y openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deploy --chown=node:node /opt/claims-os-api ./
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
