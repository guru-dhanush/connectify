FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    openssh-client \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Set proper permissions for temp directory
RUN mkdir -p /tmp && chmod 755 /tmp

EXPOSE 8080

CMD ["node", "server.js"]
