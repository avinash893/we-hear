# syntax=docker/dockerfile:1

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time defaults so Next.js static generation and Prisma generate succeed during image creation
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/dev.db"
ENV NEXTAUTH_SECRET="b157fa2dac990dd1388df16e5fec3424f873f2370d31e5692fbc5b5737a5ee72"
ENV NEXTAUTH_URL="https://p01--wehear-app--lk2bwj4glfyn.code.run"
ENV NEXT_PUBLIC_APP_URL="https://p01--wehear-app--lk2bwj4glfyn.code.run"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create unprivileged system user for container security
RUN (addgroup -g 1001 -S nodejs 2>/dev/null || addgroup --system --gid 1001 nodejs) && \
    (adduser -u 1001 -S nextjs -G nodejs 2>/dev/null || adduser --system --uid 1001 nextjs)

# Copy runtime assets and built bundles
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

RUN chown -R nextjs:nodejs /app

# Set ownership to unprivileged user
USER nextjs

EXPOSE 3000

# Container liveness health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start database push and unified Next.js + Socket.IO WebRTC server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
