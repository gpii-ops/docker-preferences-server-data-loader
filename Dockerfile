FROM node:8-alpine

WORKDIR /home/node

RUN apk add --no-cache curl git && \
    git clone --depth=1 -b GPII-2630 https://github.com/cindyli/universal.git && \
    npm install && \
    apk del git

COPY loadData.sh /usr/local/bin

CMD ["/usr/local/bin/loadData.sh"]
