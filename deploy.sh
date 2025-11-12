#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '#' | xargs)
else
    echo "❌ .env.prod file not found!"
    exit 1
fi

# Create necessary directories
mkdir -p uploads logs ssl

echo "📦 Building Docker image..."
docker build -t ${REGISTRY}/${PROJECT_NAME}:${IMAGE_TAG} \
    -f Dockerfile.prod .

echo "🔐 Logging into GitLab Registry..."
echo "${CI_REGISTRY_PASSWORD}" | docker login -u ${CI_REGISTRY_USER} \
    --password-stdin ${REGISTRY}

echo "📤 Pushing image to registry..."
docker push ${REGISTRY}/${PROJECT_NAME}:${IMAGE_TAG}
docker push ${REGISTRY}/${PROJECT_NAME}:latest

echo "🔽 Pulling latest image on production server..."
ssh -i ${DEPLOY_SSH_KEY} ${DEPLOY_USER}@${DEPLOY_HOST} \
    "cd ${DEPLOY_PATH} && docker-compose -f docker-compose.prod.yml pull"

echo "🔄 Restarting services..."
ssh -i ${DEPLOY_SSH_KEY} ${DEPLOY_USER}@${DEPLOY_HOST} \
    "cd ${DEPLOY_PATH} && docker-compose -f docker-compose.prod.yml up -d"

echo "✅ Deployment completed successfully!"

# Display logs
echo "📋 Recent logs:"
ssh -i ${DEPLOY_SSH_KEY} ${DEPLOY_USER}@${DEPLOY_HOST} \
    "cd ${DEPLOY_PATH} && docker-compose logs -f --tail=20 backend"
