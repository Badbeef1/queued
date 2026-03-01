FROM oven/bun:1 AS base
WORKDIR /app

# Build stage - full monorepo context for workspace resolution
FROM base AS build
COPY . .
RUN bun install

# Runtime stage - only what's needed to run the server
FROM oven/bun:1 AS release
WORKDIR /app

USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server ./apps/server
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./package.json

RUN chown -R bun:bun /app

EXPOSE 4000

USER bun

CMD ["bun", "apps/server/src/index.ts"]
