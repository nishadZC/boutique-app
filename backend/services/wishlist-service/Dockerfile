FROM node:26-alpine3.24
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
EXPOSE 3007
CMD ["npm", "start"]
