FROM node:20.18.0-alpine

WORKDIR /usr/local/app

COPY ./package.json ./

RUN npm install

COPY ./dist/apps/subscription .
COPY ./proto ./proto
COPY ./ssl ./ssl

EXPOSE 3000 5000

CMD [ "node", "main.js"]