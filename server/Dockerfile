# Backend Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install since no package-lock.json exists)
RUN npm install --omit=dev

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S cardcataloger -u 1001

# Copy source code
COPY . .

# Change ownership to non-root user
RUN chown -R cardcataloger:nodejs /app
USER cardcataloger

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/system/status', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]