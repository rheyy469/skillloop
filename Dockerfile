FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY prisma ./prisma

# Install workspace dependencies
RUN npm ci

# Copy source code
COPY packages ./packages
COPY apps ./apps

# Generate Prisma Client and build all workspaces
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node apps/api/dist/seed.js && node apps/api/dist/index.js"]
