FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Swapped ts-node for tsx right here!
CMD ["npx", "tsx", "server.ts"]