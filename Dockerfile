FROM node:20-alpine

WORKDIR /app

# Create non-root user before installing deps
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Hand ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
