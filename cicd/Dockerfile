FROM node:20.18.0-alpine

WORKDIR /usr/local/app

# Set NODE_ENV to production
ENV NODE_ENV=production

COPY ./package.json ./

# Install dependencies in production mode
RUN npm install

COPY ./dist/apps/medulla-ai ./medulla-ai
COPY ./dist/apps/subscription ./subscription
COPY ./dist/apps/medulla-whatsapp ./medulla-whatsapp
COPY ./dist/apps/payment ./payment
COPY ./proto ./proto
COPY ./ssl ./ssl

EXPOSE 3000 5000