FROM node:8-alpine

WORKDIR /home/node

RUN apk add --no-cache curl git && \
    git clone -b GPII-2630 https://github.com/cindyli/universal.git && \
    cd universal && \
    rm package-lock.json && \
    npm install json5 && \
    npm install fs && \
    rm -rf build && \
    mkdir -p build/dbData && \
    node scripts/convertPrefs.js testData/preferences/ build/dbData/ && \
    apk del git

COPY loadData.sh /usr/local/bin

CMD ["/usr/local/bin/loadData.sh"]
