# CouchDB Data Loader

Builds a [sidecar container](http://blog.kubernetes.io/2015/06/the-distributed-system-toolkit-patterns.html) with the CouchDB data from the GPII/universal repository baked in and a mechanism for loading them into a CouchDB database.

## Building

- `docker build -t gpii/gpii-dataloader .`

## Environment Variables

- `COUCHDB_URL`: URL of the CouchDB database. (required)
- `CLEAR_INDEX`: If defined, the database at $COUCHDB_URL will be deleted and recreated. (optional)
- `STATIC_DATA_DIR`: The directory where the static data to be loaded into CouchDB resides. (optional)
- `BUILD_DATA_DIR`: The directory where the data built from a npm step resides. (optional)

The use of environment variables for data directories is useful if you want to mount the database data using a Docker volume and point the data loader at it.

Note that since [the docker doesn't support the environment variable type of array](https://github.com/moby/moby/issues/20169), two separate environment variables are used for inputting data directories instead of one array that holds these directories.

## Running

Example using containers:

```
$ docker run -d -p 5984:5984 --name couchdb couchdb
$ docker run --rm --link couchdb -e COUCHDB_URL=http://couchdb:5984/gpii -e CLEAR_INDEX=1 gpii/gpii-dataloader
$ docker run -d -p 8081:8081 --name preferences --link couchdb -e NODE_ENV=gpii.config.preferencesServer.standalone.production  -e PREFERENCESSERVER_LISTEN_PORT=8081 -e DATASOURCE_HOSTNAME=http://couchdb -e DATASOURCE_PORT=5984 vagrant-universal

```

Loading couchdb data from a different location (e.g. /mydata):

```
$ docker run --rm -e COUCHDB_URL=http://couchdb:5984/gpii -e CLEAR_INDEX=1 -e STATIC_DATA_DIR=/static_data -v /home/user/static_data:/mydata -e BUILD_DATA_DIR=/build_data -v /home/user/build_data:/mydata gpii/gpii-dataloader
```
