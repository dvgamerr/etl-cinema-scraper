FROM denoland/deno:alpine

RUN apk add --no-cache chromium ca-certificates

WORKDIR /app

ENV ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY . .
RUN mkdir -p ./output \
  && PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@14.1.1/install.ts

RUN deno cache main.ts
CMD [ "run", "-A", "main.ts" ]