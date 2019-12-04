FROM node:12.13.1-alpine
LABEL maintainer="Mr.Kananek T. <info@touno.io>"

WORKDIR /app

COPY package.json ./

RUN npm i --only=production

COPY node_modules ./node_modules
COPY notify ./notify
COPY *.js ./

CMD ["node", "index.js"]
