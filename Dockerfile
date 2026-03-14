FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npm install
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node src/server.jsx"]
