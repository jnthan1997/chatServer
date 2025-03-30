FROM node:18.19.1
COPY ./package*.json .
RUN npm install
COPY . .
EXPOSE 4002
CMD ["node", "server.js"]