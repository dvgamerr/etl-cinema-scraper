FROM denoland/deno:alpine

WORKDIR /app

COPY . .
ENV ENV production

RUN mkdir -p ./output && \
  PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@14.1.1/install.ts
RUN deno cache main.ts

CMD [ "run", "-A", "main.ts" ]