FROM node:lts-alpine as build

RUN apk update && apk upgrade && apk add --no-cache git

ARG APP_ENV=${APP_ENV}
ARG APP_EXPLORER_API_URL=${APP_EXPLORER_API_URL}
ARG APP_EXPLORER_RTM_URL=${APP_EXPLORER_RTM_URL}
ARG APP_GATE_API_URL=${APP_GATE_API_URL}

WORKDIR /app
COPY . .
RUN npm ci && npm run production

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
