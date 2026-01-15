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

# Copy pre-generated jobs (if they exist)
COPY storage/ ./storage/ || true

# Copy environment configuration
COPY .env.render ./.env.render || true

# Install browsers
RUN npx playwright install chromium

# Expose port (for monitoring, optional)
EXPOSE 3000

# Use .env.render in production if it exists
RUN if [ -f .env.render ]; then cp .env.render .env; fi

# Run worker
CMD ["npm", "start"]
