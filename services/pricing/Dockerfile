FROM node:lts-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY app.js ./

USER node

EXPOSE 3001

CMD ["node", "app.js"]