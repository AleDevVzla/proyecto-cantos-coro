FROM oven/bun:1

WORKDIR /app

COPY package.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN bun install

WORKDIR /app/apps/web

ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

EXPOSE 5173

CMD ["bun", "run", "dev"]
