# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install only essential build dependencies
RUN apk add --no-cache python3 make g++ sqlite

# Copy package files first for better layer caching
COPY package*.json ./

# Use --no-audit to speed up installation
RUN npm ci --no-audit --no-fund

# Copy only necessary project files
COPY svelte.config.js vite.config.js jsconfig.json ./
COPY static ./static
COPY src ./src

# Create empty db directory and placeholder file for build
RUN mkdir -p /app/db && touch /app/db/build-placeholder.db

# Create .svelte-kit directory and placeholder tsconfig.json to prevent warnings
RUN mkdir -p /app/.svelte-kit && echo '{"compilerOptions":{"paths":{}}}' > /app/.svelte-kit/tsconfig.json

# Set DATABASE_URL for build time only
ENV DATABASE_URL=/app/db/build-placeholder.db NODE_ENV=production

# Build the application
RUN npm run build

# Production stage - use a smaller base image
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache sqlite

# Create non-root user and required directories
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/db && \
    chown -R appuser:appgroup /app /app/db && \
    chmod 777 /app/db

# Copy only what's needed from builder stage
COPY --from=builder --chown=appuser:appgroup /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=appuser:appgroup /app/build ./build
# Copy only production node_modules
RUN npm ci --only=production --no-audit --no-fund

# Switch to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables for production
ENV NODE_ENV=production PORT=3000

# Use wget instead of curl for healthcheck (already in base image)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:3000/health || exit 1

# Command to run the app
CMD ["node", "build/index.js"]