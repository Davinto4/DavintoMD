FROM node:18-slim
RUN apt-get update && apt-get install -y git python3 make g++ ffmpeg imagemagick && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["node", "index.js"]
