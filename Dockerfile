FROM node:8-alpine

WORKDIR /home/node

RUN apk add --no-cache curl git && \
    git clone https://github.com/GPII/universal.git && \
    cd universal && \
    rm -f package-lock.json && \
    npm install json5 && \
    npm install fs && \
    npm install rimraf && \
    npm install mkdirp && \
    node scripts/convertPrefs.js testData/preferences/ build/dbData/ && \
    apk del git

COPY deleteAndLoadSnapsets.sh /usr/local/bin/

CMD ["/usr/local/bin/deleteAndLoadSnapsets.sh"]
