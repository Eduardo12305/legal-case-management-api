FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npm ci
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "if [ \"$PRISMA_DB_PUSH_ON_START\" = \"true\" ]; then npx prisma db push; fi; node src/server.jsx"]
