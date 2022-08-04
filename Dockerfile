FROM lukechannings/deno:latest

ENV ENV production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN apt-get install chromium-browser ca-certificates

WORKDIR /app
COPY . .

RUN mkdir -p ./output && PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@14.1.1/install.ts
RUN deno cache main.ts

CMD [ "run", "-A", "main.ts" ]