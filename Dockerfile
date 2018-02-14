FROM alpine:3.6

WORKDIR /home/node

RUN apk add --no-cache curl git && \
    git clone --depth=1 -b GPII-2630 https://github.com/cindyli/universal.git && \
    apk del git

COPY loadPreferences.sh /usr/local/bin

CMD ["/usr/local/bin/loadPreferences.sh"]
