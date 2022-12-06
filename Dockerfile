FROM node:alpine as builder

WORKDIR /usr/app/client

COPY package.json package-lock.json /usr/app/client/

RUN NODE_ENV=production npm ci --include=dev

COPY * /usr/app/client

RUN npm run build

FROM nginx:alpine
COPY --from=builder /usr/app/client/build /usr/share/nginx/html

ENV LANDSCAPE=PRODUCTION

EXPOSE 80

