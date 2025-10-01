# build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# run
FROM gcr.io/distroless/nodejs20
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=build /app .
EXPOSE 4000
CMD ["server.js"]
