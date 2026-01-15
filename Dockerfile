FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production && npm install -g tsx

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY tsconfig.json ./
COPY next.config.js ./

# Copy pre-generated jobs
COPY storage/ ./storage/

# Copy environment configuration for Render
COPY .env.render ./

# Install browsers
RUN npx playwright install chromium

# Expose port (for monitoring, optional)
EXPOSE 3000

# Use .env.render as .env in production
RUN cp .env.render .env

# Run worker
CMD ["npm", "start"]
