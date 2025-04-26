#!/bin/bash

# Exit on any error
set -e

# Load deployment configuration
if [ -f "./deploy.config" ]; then
    source ./deploy.config
else
    echo "Error: deploy.config file not found. Please create it from deploy.config.example"
    exit 1
fi

# Verify required variables are set
if [ -z "$SERVER_IP" ] || [ -z "$SERVER_USER" ] || [ -z "$SERVER_DIR" ] || [ -z "$DOMAIN_NAME" ]; then
    echo "Error: Missing required configuration variables in deploy.config"
    exit 1
fi

# Set default Docker registry values if not provided
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
DOCKER_USERNAME="${DOCKER_USERNAME:-$USER}"
DOCKER_IMAGE="${DOCKER_IMAGE:-inquiry}"
DOCKER_TAG="${DOCKER_TAG:-web-latest}"

# Full Docker image name
DOCKER_FULL_IMAGE="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${DOCKER_IMAGE}:${DOCKER_TAG}"

# Parse command line arguments
NO_CACHE=false
SEED_DB=false
PRUNE_IMAGES=true

for arg in "$@"; do
    case $arg in
        --no-cache)
            NO_CACHE=true
            ;;
        --seed-db)
            SEED_DB=true
            ;;
        --no-prune)
            PRUNE_IMAGES=false
            ;;
    esac
done

echo "Starting deployment process..."
echo "Target server: ${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}"
echo "Docker image: ${DOCKER_FULL_IMAGE}"

# Step 1: Optimize and prepare server in parallel
echo "Preparing server for update..."
# Copy essential files in one SSH connection
(
    ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_DIR"
    scp docker-compose.yml $SERVER_USER@$SERVER_IP:$SERVER_DIR/
    
    # Check if .env file exists locally
    if [ -f ".env" ]; then
        echo "Copying .env file to server..."
        scp .env $SERVER_USER@$SERVER_IP:$SERVER_DIR/
    else
        echo "No local .env file found. Make sure the server has the necessary environment variables."
    fi
) &
PREPARE_PID=$!

# Step 2: Build and push Docker images with BuildKit enabled
echo "Building and pushing Docker images..."
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# Add build args to improve caching
BUILD_ARGS="--build-arg BUILDKIT_INLINE_CACHE=1"

# Add --no-cache flag if a full rebuild is needed
if [ "$NO_CACHE" = true ]; then
    echo "Performing a clean build with --no-cache..."
    docker build $BUILD_ARGS --platform linux/amd64 --no-cache --pull -t ${DOCKER_FULL_IMAGE} .
else
    echo "Using cached layers where possible..."
    docker build $BUILD_ARGS --platform linux/amd64 --pull -t ${DOCKER_FULL_IMAGE} .
fi

# Push with retry logic
MAX_RETRIES=3
for ((i=1; i<=MAX_RETRIES; i++)); do
    if docker push ${DOCKER_FULL_IMAGE}; then
        echo "Successfully pushed image"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        echo "Failed to push image after $MAX_RETRIES attempts"
        exit 1
    fi
    echo "Push failed, retrying in 5 seconds... (attempt $i/$MAX_RETRIES)"
    sleep 5
done

# Wait for server preparation to complete
wait $PREPARE_PID

# Step 3: SSH into server and update
echo "Updating server..."
ssh $SERVER_USER@$SERVER_IP "
    cd $SERVER_DIR && \
    docker-compose pull && \
    docker-compose down && \
    docker-compose up -d && \
    docker system prune -af && \
    docker volume prune -f
"

# Step 4: Check if the app is running
echo "Checking if the app is running..."
MAX_ATTEMPTS=6
for i in $(seq 1 $MAX_ATTEMPTS); do
    echo "Attempt $i: Checking container status..."
    if ssh $SERVER_USER@$SERVER_IP "docker ps | grep ${DOCKER_IMAGE}" > /dev/null; then
        echo "Container is running!"
        break
    fi
    
    if [ $i -eq $MAX_ATTEMPTS ]; then
        echo "Warning: Container not found after multiple attempts."
    else
        echo "Container not found yet, waiting..."
        sleep 5
    fi
done

# Step 5: Check health endpoint with retries
echo "Checking health endpoint..."
MAX_HEALTH_ATTEMPTS=6
for i in $(seq 1 $MAX_HEALTH_ATTEMPTS); do
    if curl -s -f -m 5 https://$DOMAIN_NAME/health > /dev/null; then
        echo "Deployment successful! Health check passed."
        break
    fi
    
    if [ $i -eq $MAX_HEALTH_ATTEMPTS ]; then
        echo "Health check failed, but deployment might still be successful."
        echo "Check the logs with: ssh $SERVER_USER@$SERVER_IP 'cd $SERVER_DIR && docker-compose logs web'"
    else
        echo "Health check attempt $i failed, retrying in 5 seconds..."
        sleep 5
    fi
done

# Step 6: Seed database if --seed-db flag was provided
if [ "$SEED_DB" = true ]; then
    echo "Seeding the database from local data..."
    
    # Check if local database exists
    if [ -f "./db/inquiry.db" ]; then
        # Optimize database transfer
        echo "Preparing database transfer..."
        
        # Create a compressed backup of the database with efficient settings
        echo "Creating compressed database backup..."
        sqlite3 ./db/inquiry.db ".backup './db/inquiry.db.bak'"
        tar -czf ./db/inquiry.db.tar.gz -C ./db inquiry.db.bak
        
        # Stop the container before copying the database
        echo "Stopping the container to safely copy the database..."
        ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose stop web"
        
        # Ensure db directory exists on server
        ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_DIR/db"
        
        # Backup existing database if it exists
        ssh $SERVER_USER@$SERVER_IP "if [ -f $SERVER_DIR/db/inquiry.db ]; then cp $SERVER_DIR/db/inquiry.db $SERVER_DIR/db/inquiry.db.backup; echo 'Existing database backed up.'; fi"
        
        # Copy compressed database to server with compression
        echo "Copying compressed database to server..."
        scp -C ./db/inquiry.db.tar.gz $SERVER_USER@$SERVER_IP:$SERVER_DIR/db/
        
        # Extract and restore database on server
        echo "Extracting and restoring database on server..."
        ssh $SERVER_USER@$SERVER_IP "
            cd $SERVER_DIR/db && \
            tar -xzf inquiry.db.tar.gz && \
            mv inquiry.db.bak inquiry.db && \
            chmod 666 inquiry.db && \
            rm inquiry.db.tar.gz
        "
        
        # Clean up local temporary files
        rm ./db/inquiry.db.bak ./db/inquiry.db.tar.gz
        
        # Restart the container
        echo "Restarting the container..."
        ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose start web"
        
        echo "Database seeded successfully!"
    else
        echo "Error: Local database file not found at ./db/inquiry.db"
        exit 1
    fi
fi

# Clean up local Docker resources after successful deployment
if [ "$PRUNE_IMAGES" = true ]; then
    echo "Cleaning up local Docker resources..."
    docker image rm ${DOCKER_FULL_IMAGE} 2>/dev/null || true
    docker system prune -af --filter "until=24h"
    docker builder prune -f --filter "until=24h"
fi

echo "Deployment completed!"