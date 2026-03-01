FROM oven/bun:1 AS base
WORKDIR /app

# Build stage — empty VITE_SERVER_URL makes the web use relative URLs (/trpc, /events/...)
# so a single pre-built image works regardless of the host IP/domain.
FROM base AS build
ARG VITE_SERVER_URL=
ENV VITE_SERVER_URL=$VITE_SERVER_URL

COPY . .
RUN bun install
RUN bun run --filter @queued/web build

# Production stage — static files served by nginx, API proxied to server container
FROM nginx:alpine AS release
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
