FROM alpine as downloader

ARG PLATFORM=linux/arm64
RUN apk add --no-cache curl unzip bash

SHELL ["/bin/bash", "-c"]
RUN [ "$PLATFORM" == "linux/arm64" ] \
  && curl -Lsf https://github.com/LukeChannings/deno-arm64/releases/download/v1.24.1/deno-$(echo $PLATFORM | tr '/' '-').zip -o deno.zip || true
RUN [ "$PLATFORM" != "linux/arm64" ] \
  && curl -Lsf https://github.com/denoland/deno/releases/download/v1.24.2/deno-x86_64-unknown-linux-gnu.zip -o deno.zip || true

RUN unzip deno && rm deno.zip

FROM alpine

# Installs latest Chromium (100) package.
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

RUN addgroup -S deno \
  && adduser -S -G deno deno \
  && mkdir /deno-dir/ \
  && chown -R deno:deno /deno-dir/

ENV DENO_DIR /deno-dir/
ENV DENO_INSTALL_ROOT /usr/local

COPY --from=downloader /deno /bin/deno

RUN chmod 755 /bin/deno
RUN ls -al /bin && deno --help

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

WORKDIR /app

COPY . .

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    
RUN mkdir -p output \
  && PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@14.1.1/install.ts

RUN deno cache main.ts
CMD [ "run", "-A", "main.ts" ]