FROM alpine as deno

ARG PLATFORM=linux/amd64
ARG DENO_VERSION=v1.24.1

RUN apk add unzip curl

WORKDIR /deno

RUN [ "$PLATFORM" == "linux/arm64" ] && \
  curl -Lsf https://github.com/LukeChannings/deno-arm64/releases/download/${DENO_VERSION}/deno-arm64.zip -o deno.zip || true
RUN [ "$PLATFORM" == "linux/amd64" ] && \
  curl -Lsf https://github.com/denoland/deno/releases/download/${DENO_VERSION}/deno-x86_64-unknown-linux-gnu.zip -o deno.zip || true

RUN unzip deno.zip && rm deno.zip && chmod 755 deno


FROM alpine AS tini

RUN apk add curl

ARG PLATFORM=linux/amd64
ARG TINI_VERSION=0.19.0
RUN echo $(echo $PLATFORM | tr '/' '-')

RUN [ "$PLATFORM" == "linux/arm64" ] && \
  curl -fsSL https://github.com/krallin/tini/releases/download/v${TINI_VERSION}/tini-arm64 --output /tini && \
  chmod 755 /tini || true

RUN [ "$PLATFORM" == "linux/amd64" ] && \
  curl -fsSL https://github.com/krallin/tini/releases/download/v${TINI_VERSION}/tini-amd64 --output /tini && \
  chmod 755 /tini || true


FROM alpine

COPY --from=tini /tini /tini
COPY --from=deno /deno /bin/deno

RUN chmod 755 /bin/deno

RUN mkdir /deno-dir/

ENV DENO_DIR /deno-dir/
ENV DENO_INSTALL_ROOT /usr/local

# Installs latest Chromium (100) package.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY . .

RUN mkdir -p ./output && \
  PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@14.1.1/install.ts
RUN deno cache main.ts

ENTRYPOINT ["/tini", "--", "deno"]
CMD [ "run", "-A", "main.ts" ]