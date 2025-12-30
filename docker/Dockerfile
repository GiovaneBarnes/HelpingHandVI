# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package*.json ./apps/api/

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY apps/api/ ./apps/api/
COPY database/ ./database/

# Build the application
WORKDIR /app/apps/api
RUN pnpm run build

# Create production image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm
RUN pnpm install --prod

# Copy built application from build stage
COPY --from=0 /app/apps/api/dist ./dist
COPY --from=0 /app/database ./database

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "dist/server.js"]