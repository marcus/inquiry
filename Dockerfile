# Build stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    python3 \
    make \
    g++ \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Clean node_modules and rebuild native modules from scratch
RUN rm -rf node_modules/better-sqlite3 && \
    npm install better-sqlite3 --build-from-source

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install only the necessary runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user and required directories
RUN useradd -m -r appuser && \
    mkdir -p /app/db && \
    chown -R appuser:appuser /app

# Copy built application from builder stage
COPY --from=builder --chown=appuser:appuser /app/package*.json ./
COPY --from=builder --chown=appuser:appuser /app/.svelte-kit ./.svelte-kit
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/server.js ./

# Switch to non-root user
USER appuser

# Create db directory and ensure it's writable
RUN mkdir -p /app/db && chmod 777 /app/db

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Command to run the app
CMD ["node", "server.js"]