# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Only copy built files and production dependencies
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/dist ./dist
# Install only production dependencies
RUN npm ci --only=production

EXPOSE 5000
CMD ["npm", "start"]
