# Build the React app, then run the API, which also serves the built files.
FROM node:22-alpine AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production CLIENT_DIR=/app/public
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/src ./src
COPY --from=client /client/dist ./public
USER node
EXPOSE 4000
CMD ["node", "src/index.js"]
