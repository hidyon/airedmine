FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173

COPY package.json ./
COPY src ./src
COPY README.md ./
COPY docs ./docs

EXPOSE 5173

CMD ["npm", "start"]
