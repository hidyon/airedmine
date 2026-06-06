FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173

COPY package.json ./
COPY src ./src

EXPOSE 5173

CMD ["npm", "start"]
