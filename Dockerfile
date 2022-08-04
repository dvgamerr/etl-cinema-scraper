FROM denoland/deno:alpine

# Installs latest Chromium (100) package.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      udev

WORKDIR /app

COPY . .

RUN mkdir -p ./output && \
  PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@14.1.1/install.ts
RUN deno cache main.ts

CMD [ "run", "-A", "main.ts" ]