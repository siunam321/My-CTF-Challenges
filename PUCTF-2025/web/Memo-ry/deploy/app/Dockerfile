FROM node:latest

WORKDIR /app

COPY ./src/. .
RUN npm i

RUN mkdir /app/database

RUN apt-get update -y
RUN npx playwright install-deps
RUN npx playwright install chromium

EXPOSE 3000
CMD ["node", "app.js"]