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

echo "Starting deployment process..."
echo "Target server: ${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}"
echo "Docker image: ${DOCKER_FULL_IMAGE}"

# Step 1: Clean up local Docker resources
echo "Cleaning up local Docker resources..."
docker system prune -f

# Step 2: Build and push Docker images
echo "Building and pushing Docker images..."
docker build --platform linux/amd64 -t ${DOCKER_FULL_IMAGE} .
docker push ${DOCKER_FULL_IMAGE}

# Step 3: Copy only the essential configuration files to server
echo "Copying essential configuration files to server..."
scp docker-compose.yml $SERVER_USER@$SERVER_IP:$SERVER_DIR/

# Check if .env file exists locally
if [ -f ".env" ]; then
    echo "Copying .env file to server..."
    scp .env $SERVER_USER@$SERVER_IP:$SERVER_DIR/
else
    echo "No local .env file found. Make sure the server has the necessary environment variables."
fi

# Step 4: SSH into server and update
echo "Updating server..."
ssh $SERVER_USER@$SERVER_IP "
    cd $SERVER_DIR && \
    docker-compose down && \
    docker-compose pull && \
    docker-compose up -d && \
    docker system prune -f
"

# Step 5: Check if the app is running
echo "Checking if the app is running..."
ssh $SERVER_USER@$SERVER_IP "
    echo \"Waiting for the app to start...\" && \
    sleep 10 && \
    docker ps | grep ${DOCKER_IMAGE}
"

# Step 6: Wait for services to start and check health
echo "Waiting for services to start..."
sleep 10

# Step 7: Check health endpoint
echo "Checking health endpoint..."
if curl -s -f https://$DOMAIN_NAME/health > /dev/null; then
    echo "Deployment successful! Health check passed."
else
    echo "Health check failed, but deployment might still be successful."
    echo "Check the logs with: ssh $SERVER_USER@$SERVER_IP 'cd $SERVER_DIR && docker-compose logs web'"
fi

# Step 8: Ask if this is the first deployment and if the database should be seeded
read -p "Is this the first deployment? Do you want to seed the database with local data? (y/n): " seed_db
if [ "$seed_db" = "y" ] || [ "$seed_db" = "Y" ]; then
    echo "Preparing to seed the database..."
    
    # Check if local database exists
    if [ -f "./db/inquiry.db" ]; then
        # Stop the container before copying the database
        echo "Stopping the container to safely copy the database..."
        ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose stop web"
        
        # Ensure db directory exists on server
        ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_DIR/db"
        
        # Backup existing database if it exists
        ssh $SERVER_USER@$SERVER_IP "if [ -f $SERVER_DIR/db/inquiry.db ]; then cp $SERVER_DIR/db/inquiry.db $SERVER_DIR/db/inquiry.db.backup; echo 'Existing database backed up.'; fi"
        
        # Copy local database to server
        echo "Copying local database to server..."
        scp ./db/inquiry.db $SERVER_USER@$SERVER_IP:$SERVER_DIR/db/
        
        # Set proper permissions
        echo "Setting proper permissions on the server..."
        ssh $SERVER_USER@$SERVER_IP "chmod 666 $SERVER_DIR/db/inquiry.db"
        
        # Restart the container
        echo "Restarting the container..."
        ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose start web"
        
        echo "Database seeded successfully!"
    else
        echo "Error: Local database file not found at ./db/inquiry.db"
    fi
fi

echo "Deployment completed!"