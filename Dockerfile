FROM oven/bun:alpine
WORKDIR /app

COPY . .

RUN bun i

ENTRYPOINT ["bun", "start"]