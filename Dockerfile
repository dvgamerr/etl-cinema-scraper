FROM oven/bun:alpine
WORKDIR /app

COPY index.js package.json bun.lockb .

COPY ./untils/ ./untils/
COPY ./plugins/ ./plugins/

RUN bun i --ignore-scripts --production

CMD ["bun", "run", "/app/index.js"]