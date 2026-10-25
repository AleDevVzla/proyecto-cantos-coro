FROM oven/bun:1

WORKDIR /app/apps/web

COPY packages/shared /app/packages/shared
COPY apps/web /app/apps/web
RUN rm -rf /app/apps/web/node_modules/@cantos/shared && mkdir -p /app/apps/web/node_modules/@cantos && cp -r /app/packages/shared /app/apps/web/node_modules/@cantos/shared

ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

EXPOSE 5173

CMD ["bun", "node_modules/vite/bin/vite.js", "--host", "0.0.0.0", "--port", "5173"]
