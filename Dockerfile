FROM node:8-alpine

WORKDIR /home/node

RUN apk add --no-cache curl git

COPY deleteAndLoadSnapsets.sh /usr/local/bin/

CMD ["/usr/local/bin/deleteAndLoadSnapsets.sh"]
