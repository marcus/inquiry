# Available commands
default:
    @just --list

# Run the development server
dev:
    npm run dev

# Run tests
test:
    npm run test:unit -- --run

# Deploy the application
deploy *args:
    ./deploy.sh {{args}}

# Deploy with no cache
deploy-clean:
    ./deploy.sh --no-cache

# Deploy and seed the database
deploy-seed:
    ./deploy.sh --seed-db 