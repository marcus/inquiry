# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for building
RUN apk add --no-cache python3 make g++ curl sqlite

# Copy only package files first (better layer caching)
COPY package*.json ./

# Install dependencies with cache mounting for faster builds
RUN npm ci

# Copy only necessary project files
COPY svelte.config.js vite.config.js jsconfig.json ./
COPY static ./static
COPY src ./src

# Create db directory for build time
RUN mkdir -p /app/db

# Set a default DATABASE_URL for build time only
ENV DATABASE_URL=/app/db/build-placeholder.db

# Create an empty placeholder database file
RUN touch /app/db/build-placeholder.db

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache curl sqlite

# Create non-root user and required directories
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/db && \
    chown -R appuser:appgroup /app

# Copy built application from builder stage (only what's needed)
COPY --from=builder --chown=appuser:appgroup /app/package*.json ./
COPY --from=builder --chown=appuser:appgroup /app/build ./build
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

# Switch to non-root user
USER appuser

# Ensure db directory is writable
RUN mkdir -p /app/db && chmod 777 /app/db

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables for production
ENV NODE_ENV=production
ENV PORT=3000
# The actual DATABASE_URL will be provided at runtime via docker-compose

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Command to run the app
CMD ["node", "build/index.js"]