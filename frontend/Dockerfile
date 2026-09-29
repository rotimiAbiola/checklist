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
# VITE_API_URL defaults to "" so API calls are same-origin relative paths
# (e.g. /api/todos) - the right choice when a reverse proxy in front of this
# container also proxies /api and /health to the backend on the same domain.
FROM base AS build
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
