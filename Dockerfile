FROM --platform=linux/arm64 oven/bun:alpine
WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium
ENV DEBIAN_FRONTEND=noninteractive

# Installs Chromium (100) package.
RUN apk add --no-cache \
      chromium \
      chromium-sandbox \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs

RUN bun x @puppeteer/browsers install chrome@stable

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

COPY index.js package.json bun.lockb .

COPY ./untils/ ./untils/
COPY ./plugins/ ./plugins/

RUN bun i --ignore-scripts --production && \
    bun ./node_modules/puppeteer/install.mjs

CMD ["bun", "run", "/app/index.js"]