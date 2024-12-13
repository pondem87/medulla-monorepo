FROM node:20.18.0-alpine

WORKDIR /usr/local/app

COPY ./package.json ./

RUN npm install

COPY ./dist/apps/medulla-ai ./medulla-ai
COPY ./dist/apps/subscription ./subscription
COPY ./dist/apps/medulla-whatsapp ./medulla-whatsapp
COPY ./proto ./proto
COPY ./ssl ./ssl

EXPOSE 3000 5000