#!/bin/bash

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load deployment configuration
if [ -f "./deploy.config" ]; then
    source ./deploy.config
else
    echo -e "${RED}Error: deploy.config file not found. Please create it from deploy.config.example${NC}"
    exit 1
fi

# Verify required variables are set
if [ -z "$SERVER_IP" ] || [ -z "$SERVER_USER" ] || [ -z "$SERVER_DIR" ]; then
    echo -e "${RED}Error: Missing required configuration variables in deploy.config${NC}"
    exit 1
fi

echo -e "${GREEN}Starting pre-deployment checks...${NC}"

# Check 1: Local environment
echo -e "\n${GREEN}Checking local environment:${NC}"

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Docker is installed${NC}"
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed or not in PATH${NC}"
    exit 1
else
    echo -e "${GREEN}✅ docker-compose is installed${NC}"
fi

# Check if required files exist
echo -e "\n${GREEN}Checking required files:${NC}"
required_files=("Dockerfile" "docker-compose.yml" "server.js" "VERSION")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file $file not found${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ $file exists${NC}"
    fi
done

# Check if local .env file exists
echo -e "\n${GREEN}Checking local .env file:${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ Local .env file not found. This might be needed for environment variables.${NC}"
else
    echo -e "${GREEN}✅ Local .env file exists${NC}"
    
    # Check for required environment variables in .env
    required_vars=("OPENAI_API_KEY")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env; then
            echo -e "${YELLOW}⚠️ Environment variable $var not found in local .env${NC}"
        else
            echo -e "${GREEN}✅ Environment variable $var found in local .env${NC}"
        fi
    done
fi

# Check 2: Remote server accessibility
echo -e "\n${GREEN}Checking remote server accessibility:${NC}"

# Check SSH connection
echo "Checking SSH connection to $SERVER_USER@$SERVER_IP..."
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 $SERVER_USER@$SERVER_IP "echo 2>&1" > /dev/null; then
    echo -e "${RED}❌ Cannot connect to server via SSH. Check your SSH keys and server status.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ SSH connection successful${NC}"
fi

# Check 3: Remote server environment
echo -e "\n${GREEN}Checking remote server environment:${NC}"

# Check if Docker is installed on the server
echo "Checking if Docker is installed on the server..."
if ! ssh $SERVER_USER@$SERVER_IP "command -v docker > /dev/null && echo yes || echo no" | grep -q "yes"; then
    echo -e "${RED}❌ Docker is not installed on the server${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Docker is installed on the server${NC}"
fi

# Check if docker-compose is installed on the server
echo "Checking if docker-compose is installed on the server..."
if ! ssh $SERVER_USER@$SERVER_IP "command -v docker-compose > /dev/null && echo yes || echo no" | grep -q "yes"; then
    echo -e "${RED}❌ docker-compose is not installed on the server${NC}"
    exit 1
else
    echo -e "${GREEN}✅ docker-compose is installed on the server${NC}"
fi

# Check if the deployment directory exists
echo "Checking if deployment directory exists on the server..."
if ! ssh $SERVER_USER@$SERVER_IP "[ -d $SERVER_DIR ] && echo yes || echo no" | grep -q "yes"; then
    echo -e "${YELLOW}⚠️ Deployment directory $SERVER_DIR does not exist on the server${NC}"
    read -p "Do you want to create it? (y/n): " create_dir
    if [ "$create_dir" = "y" ] || [ "$create_dir" = "Y" ]; then
        ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_DIR"
        echo -e "${GREEN}✅ Created deployment directory on the server${NC}"
    else
        echo -e "${RED}❌ Deployment directory must exist before deployment${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Deployment directory exists on the server${NC}"
fi

# Check if .env file exists on the server
echo "Checking if .env file exists on the server..."
if ! ssh $SERVER_USER@$SERVER_IP "[ -f $SERVER_DIR/.env ] && echo yes || echo no" | grep -q "yes"; then
    echo -e "${YELLOW}⚠️ .env file not found on the server. This might be needed for environment variables.${NC}"
    
    if [ -f ".env" ]; then
        read -p "Do you want to copy your local .env file to the server? (y/n): " copy_env
        if [ "$copy_env" = "y" ] || [ "$copy_env" = "Y" ]; then
            scp .env $SERVER_USER@$SERVER_IP:$SERVER_DIR/.env
            echo -e "${GREEN}✅ Copied .env file to the server${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ No local .env file to copy to the server${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file exists on the server${NC}"
    
    # Check for required environment variables in server .env
    echo "Checking required environment variables on the server..."
    required_vars=("OPENAI_API_KEY")
    for var in "${required_vars[@]}"; do
        if ! ssh $SERVER_USER@$SERVER_IP "grep -q \"^$var=\" $SERVER_DIR/.env"; then
            echo -e "${YELLOW}⚠️ Environment variable $var not found in server .env${NC}"
        else
            echo -e "${GREEN}✅ Environment variable $var found in server .env${NC}"
        fi
    done
fi

# Check 4: Docker registry access
echo -e "\n${GREEN}Checking Docker registry access:${NC}"

# Set default Docker registry values if not provided
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
DOCKER_USERNAME="${DOCKER_USERNAME:-$USER}"

# Check if logged in to GitHub Container Registry locally
echo "Checking local $DOCKER_REGISTRY login status..."
if ! docker info | grep -q "$DOCKER_REGISTRY"; then
    echo -e "${YELLOW}⚠️ Not logged in to $DOCKER_REGISTRY locally${NC}"
    echo -e "${YELLOW}⚠️ You may need to run: echo '<your_personal_access_token>' | docker login $DOCKER_REGISTRY -u $DOCKER_USERNAME --password-stdin${NC}"
else
    echo -e "${GREEN}✅ Logged in to $DOCKER_REGISTRY locally${NC}"
fi

# Check if logged in to GitHub Container Registry on the server
echo "Checking server $DOCKER_REGISTRY login status..."
if ! ssh $SERVER_USER@$SERVER_IP "docker info 2>/dev/null | grep -q \"$DOCKER_REGISTRY\""; then
    echo -e "${YELLOW}⚠️ Not logged in to $DOCKER_REGISTRY on the server${NC}"
    echo -e "${YELLOW}⚠️ You may need to run on the server: echo '<your_personal_access_token>' | docker login $DOCKER_REGISTRY -u $DOCKER_USERNAME --password-stdin${NC}"
else
    echo -e "${GREEN}✅ Logged in to $DOCKER_REGISTRY on the server${NC}"
fi

# Check 5: Network connectivity
echo -e "\n${GREEN}Checking network connectivity:${NC}"

# Get port from docker-compose.yml or use default
PORT=$(grep -E '"([0-9]+):' docker-compose.yml | head -1 | sed -E 's/.*"([0-9]+).*/\1/')
PORT=${PORT:-5020}

# Check if port is available on the server
echo "Checking if port $PORT is available on the server..."
if ssh $SERVER_USER@$SERVER_IP "netstat -tuln | grep ':$PORT '" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Port $PORT is already in use on the server${NC}"
    echo -e "${YELLOW}⚠️ You may need to choose a different port or stop the service using it${NC}"
else
    echo -e "${GREEN}✅ Port $PORT is available on the server${NC}"
fi

# Check 6: Database
echo -e "\n${GREEN}Checking database:${NC}"

# Check if local database exists for seeding
if [ -f "./db/inquiry.db" ]; then
    echo -e "${GREEN}✅ Local database exists for seeding${NC}"
else
    echo -e "${YELLOW}⚠️ Local database not found at ./db/inquiry.db${NC}"
    echo -e "${YELLOW}⚠️ You won't be able to seed the database during first deployment${NC}"
fi

# Final summary
echo -e "\n${GREEN}Pre-deployment check summary:${NC}"
echo -e "${GREEN}✅ Local environment is ready for deployment${NC}"
echo -e "${GREEN}✅ Remote server is accessible${NC}"
echo -e "${GREEN}✅ Remote server environment is properly configured${NC}"
echo -e "${GREEN}✅ All required files are present${NC}"

echo -e "\n${GREEN}You are ready to deploy! Run ./deploy.sh to start the deployment process.${NC}"
