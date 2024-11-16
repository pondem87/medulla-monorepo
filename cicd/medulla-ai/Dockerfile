FROM node:20.18.0-alpine

WORKDIR /usr/local/app

COPY ./dist/apps/medulla-ai .

COPY ./package.json ./

RUN npm install

COPY ./proto ./proto
COPY ./ssl ./ssl

EXPOSE 3000

CMD [ "node", "main.js"]
