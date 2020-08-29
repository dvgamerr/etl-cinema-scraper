FROM node:lts-alpine
LABEL maintainer="Mr.Kananek T. <info@touno.io>"

ENV NODE_ENV production

WORKDIR /app
COPY . /app

RUN npm i

CMD ["node", "index.js"]