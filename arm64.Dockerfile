FROM lukechannings/deno:latest as usr
# ENV TZ=Asia/Bangkok DEBIAN_FRONTEND=noninteractive

# # Installs latest Chromium (100) package.
# RUN apt-get update -y && apt-get upgrade -y
# RUN apt-get install -y build-essential python ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxtst6 lsb-release wget gnupg xdg-utils chromium-browser fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 libgconf-2-4 gconf-service libgdk-pixbuf2.0-0 libappindicator1 libgbm-dev --no-install-recommends




# # RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
# #     && sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
# #     && apt-get update \
# #     && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
# #       --no-install-recommends \
# #     && rm -rf /var/lib/apt/lists/*
# # Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
#     PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# WORKDIR /app

# RUN mkdir -p output \
#   && PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@14.1.1/install.ts

# COPY . .

# RUN deno cache main.ts
# CMD [ "run", "-A", "main.ts" ]

FROM alpine

RUN apk add --no-cache chromium ca-certificates

WORKDIR /app

COPY --from=usr /bin/deno /bin/deno
RUN chmod 755 /bin/deno

ENV DENO_DIR /deno-dir/
ENV DENO_INSTALL_ROOT /usr/local

ENV ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY . .
RUN mkdir -p ./output \
  && PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@14.1.1/install.ts

RUN deno cache main.ts
CMD [ "run", "-A", "main.ts" ]