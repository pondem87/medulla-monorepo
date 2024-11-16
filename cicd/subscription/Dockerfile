FROM node:20.18.0-alpine

WORKDIR /usr/local/app

COPY ./dist/apps/subscription .

COPY ./package.json ./

RUN npm install

COPY ./proto ./proto
COPY ./ssl ./ssl

EXPOSE 3000 5000

CMD [ "node", "main.js"]