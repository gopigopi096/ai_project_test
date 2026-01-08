# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY frontend/ihms-portal/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ihms-portal/ ./

# Build for production
RUN npm run build:prod

# Stage 2: Production
FROM nginx:alpine

# Copy custom nginx config
COPY frontend/ihms-portal/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist/ihms-portal/browser /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

