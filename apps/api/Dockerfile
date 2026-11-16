FROM oven/bun:1

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN bun install

WORKDIR /app/apps/api

RUN chmod +x ./entrypoint.sh && bun prisma generate

EXPOSE 4000

ENTRYPOINT ["/app/apps/api/entrypoint.sh"]
