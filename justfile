# Available commands
default:
    @just --list

# Run the development server
dev:
    npm run dev

# Run tests
test:
    npm run test:unit -- --run

# Display database migration status
db-status:
    npm run migrate:status

# Apply all pending database migrations
db-migrate:
    npm run migrate:up

# Rollback database migrations to a specific version
db-rollback VERSION:
    npm run migrate:rollback -- {{VERSION}}

# Create a new database migration
db-create NAME:
    npm run migrate:create -- {{NAME}}

# Mirror production database to local development
mirror-production:
    #!/usr/bin/env bash
    set -e
    
    # Load deployment configuration
    if [ -f "./deploy.config" ]; then
        source ./deploy.config
    else
        echo "Error: deploy.config file not found. Please create it from deploy.config.example"
        exit 1
    fi
    
    # Verify required variables are set
    if [ -z "$SERVER_IP" ] || [ -z "$SERVER_USER" ] || [ -z "$SERVER_DIR" ]; then
        echo "Error: Missing required configuration variables in deploy.config"
        exit 1
    fi
    
    # Configuration
    LOCAL_DB="./db/inquiry.db"
    BACKUP_DIR="./db/backups"
    BACKUP_PREFIX="inquiry_backup_"
    MAX_BACKUPS=3
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Create backup of current local database with timestamp
    if [ -f "$LOCAL_DB" ]; then
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}${TIMESTAMP}.db"
        echo "Backing up current database to $BACKUP_FILE"
        cp "$LOCAL_DB" "$BACKUP_FILE"
    else
        echo "No local database found to backup."
        mkdir -p "./db"
    fi
    
    # Pull production database
    echo "Fetching production database from ${SERVER_USER}@${SERVER_IP}..."
    
    # Create a temporary directory
    TMP_DIR=$(mktemp -d)
    
    # Get web container name on the server
    echo "Getting web container name..."
    CONTAINER_ID=$(ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose ps -q web")
    if [ -z "$CONTAINER_ID" ]; then
        echo "Error: Could not find the web container. Make sure it's running."
        exit 1
    fi
    echo "Found container ID: $CONTAINER_ID"
    
    # Path to database inside container
    DB_PATH="/app/db/inquiry.db"
    
    # Create compressed backup of production database and download it
    echo "Creating compressed backup of production database..."
    ssh $SERVER_USER@$SERVER_IP "
        cd $SERVER_DIR && \
        mkdir -p /tmp/db_backup && \
        docker-compose exec -T web sh -c 'cat $DB_PATH' > /tmp/db_backup/inquiry.db && \
        tar -czf /tmp/inquiry.db.tar.gz -C /tmp/db_backup inquiry.db && \
        chmod 644 /tmp/inquiry.db.tar.gz
    "
    
    # Download the compressed database
    echo "Downloading database..."
    scp $SERVER_USER@$SERVER_IP:/tmp/inquiry.db.tar.gz $TMP_DIR/
    
    # Extract and restore database locally
    echo "Extracting and restoring database locally..."
    tar -xzf $TMP_DIR/inquiry.db.tar.gz -C $TMP_DIR
    mv $TMP_DIR/inquiry.db $LOCAL_DB
    chmod 644 $LOCAL_DB
    
    # Clean up remote temporary files
    ssh $SERVER_USER@$SERVER_IP "rm -rf /tmp/db_backup /tmp/inquiry.db.tar.gz"
    
    # Clean up local temporary files
    rm -rf $TMP_DIR
    
    echo "Local database has been updated from production."
    
    # Clean up old backups, keeping only the most recent MAX_BACKUPS
    echo "Cleaning up old backups, keeping most recent $MAX_BACKUPS..."
    ls -t "${BACKUP_DIR}/${BACKUP_PREFIX}"*.db | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
    
    echo "✅ Database mirror complete"

# Deploy the application
deploy *args:
    ./deploy.sh {{args}}

# Deploy with no cache
deploy-clean:
    ./deploy.sh --no-cache

# Deploy and seed the database
deploy-seed:
    ./deploy.sh --seed-db 

build:
    npm run build
