FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Local development: Vite dev server with hot reload (source is bind-mounted
# over this in docker-compose.yml).
FROM base AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production: build static assets, then serve them with nginx.
FROM base AS build
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
