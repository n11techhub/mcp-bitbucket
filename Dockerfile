# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the project
RUN npm run build

# Remove development dependencies to lighten the artifacts
RUN npm prune --production

# Stage 2: Create the final, lean production image
FROM node:18-alpine

WORKDIR /usr/src/app

# Create a non-root user and group for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the built application and production dependencies from the builder stage
# Ensure the new user owns the files
COPY --from=builder --chown=appuser:appgroup /usr/src/app/build ./build
COPY --from=builder --chown=appuser:appgroup /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /usr/src/app/package.json .

# Create logs directory and set appropriate permissions
RUN mkdir -p /usr/src/app/logs && chown -R appuser:appgroup /usr/src/app/logs

# Switch to the non-root user
USER appuser

# Set environment variables to enable both servers by default
ENV ENABLE_SSE_TRANSPORT=true
ENV MCP_SSE_PORT=9000

# Expose the port that the SSE server will listen on
EXPOSE 9000

# The command to start the application (runs both servers)
CMD ["npm", "start"]
