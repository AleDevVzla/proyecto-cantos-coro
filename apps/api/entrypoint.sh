#!/bin/sh
set -e

echo "🔄 Sincronizando esquema Prisma con PostgreSQL..."
cd /app
bun prisma generate
bun prisma db push --accept-data-loss

echo "🌱 Ejecutando seed inicial de datos..."
bun prisma/seed.ts

echo "🚀 Iniciando servidor Bun + ElysiaJS..."
exec bun src/index.ts
