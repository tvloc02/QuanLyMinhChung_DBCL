# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Stage 2: Runtime
FROM nginx:latest-alpine

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
