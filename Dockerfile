FROM oven/bun:alpine
WORKDIR /app

COPY index.js package.json bun.lockb .

COPY ./untils/ ./untils/
COPY ./plugins/ ./plugins/

RUN bun i --ignore-scripts --production && \
    bun ./node_modules/puppeteer/install.mjs

CMD ["bun", "run", "/app/index.js"]