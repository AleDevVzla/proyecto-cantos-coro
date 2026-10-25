FROM chazki-backend:latest

WORKDIR /app

RUN rm -rf /app/src /app/test /app/prisma /app/speech_database.msp

COPY packages/shared /app/node_modules/@cantos/shared
COPY apps/api/package.json /app/package.json
COPY apps/api/tsconfig.json /app/tsconfig.json
COPY apps/api/prisma /app/prisma
COPY apps/api/src /app/src
COPY apps/api/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh && bun prisma generate

EXPOSE 4000

ENTRYPOINT ["/app/entrypoint.sh"]
