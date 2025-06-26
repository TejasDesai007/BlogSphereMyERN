# Stage 1: Build Vite app
FROM node:18 as builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Fix for React Router - handle client-side routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]