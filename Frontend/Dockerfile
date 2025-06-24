FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
# Serve with NGINX
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
EXPOSE 80