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

# Install browsers
RUN npx playwright install chromium

# Expose port (for monitoring, optional)
EXPOSE 3000

# Run worker
CMD ["npm", "start"]
