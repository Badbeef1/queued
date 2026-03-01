#!/bin/bash
set -e

VERSION="v0.1.0"

echo "Building and pushing Queued images to DockerHub..."

# Build and push server
echo "Building server ${VERSION}..."
docker build -f apps/server/Dockerfile \
  -t smalboeuf1/queued-server:${VERSION} \
  -t smalboeuf1/queued-server:latest \
  .
echo "Pushing server ${VERSION}..."
docker push smalboeuf1/queued-server:${VERSION}
docker push smalboeuf1/queued-server:latest

# Build and push web (VITE_SERVER_URL left empty → relative URLs, nginx proxies to server)
echo "Building web ${VERSION}..."
docker build -f apps/web/Dockerfile \
  -t smalboeuf1/queued-web:${VERSION} \
  -t smalboeuf1/queued-web:latest \
  .
echo "Pushing web ${VERSION}..."
docker push smalboeuf1/queued-web:${VERSION}
docker push smalboeuf1/queued-web:latest

echo "Done! Images pushed:"
echo "  smalboeuf1/queued-server:${VERSION}"
echo "  smalboeuf1/queued-web:${VERSION}"
