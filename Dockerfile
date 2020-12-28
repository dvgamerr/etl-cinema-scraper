# FROM node:lts-alpine
# LABEL maintainer="Mr.Kananek T. <info@touno.io>"

# ENV NODE_ENV production

# WORKDIR /app
# COPY . /app

# RUN npm i

# CMD ["node", "index.js"]
FROM keymetrics/pm2:12-alpine

ENV NODE_ENV production

WORKDIR /app
COPY . /app

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install --production

CMD [ "pm2-runtime", "start", "pm2.json" ]