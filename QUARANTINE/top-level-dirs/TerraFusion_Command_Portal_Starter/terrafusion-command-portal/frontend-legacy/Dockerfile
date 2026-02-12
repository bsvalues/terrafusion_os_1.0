FROM node:20
WORKDIR /app
COPY package.json .
RUN npm i -g pnpm && pnpm i
COPY . .
ENV BACKEND_URL=http://localhost:8787
EXPOSE 3000
CMD ["pnpm","dev","-p","3000"]
