FROM node:12.13.1-alpine
LABEL maintainer="Mr.Kananek T. <info@touno.io>"

WORKDIR /app

RUN npm i --only=production

COPY node_modules ./node_modules
COPY notify ./notify
COPY package.json *.js ./

CMD ["node", "index.js"]
