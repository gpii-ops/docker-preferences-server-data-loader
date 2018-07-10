#!/bin/sh

STATIC_DATA_DIR=${STATIC_DATA_DIR:-/home/node/universal/testData/dbData}
BUILD_DATA_DIR=${BUILD_DATA_DIR:-/home/node/universal/build/dbData}
NODE_PATH=${NODE_PATH:-/home/node/universal}

log() {
  echo "$(date +'%Y-%m-%d %H:%M:%S') - $1"
}

loadData() {
  log "Loading data from $1"

  for file in $1/*.json; do
    log "Submitting $file"

    curl -H 'Content-Type: application/json' -X POST "$COUCHDB_URL/_bulk_docs" -d @- <<CURL_DATA
{"docs": $(cat $file)}
CURL_DATA

    if [ $? -ne 0 ]; then
      log "Error submitting $file. Terminating."
      exit 1
    fi
  done
  log "Finished loading data from $1"
}

if [ -z "$COUCHDB_URL" ]; then
  echo "COUCHDB_URL environment variable must be defined"
  exit 1
fi

log "Starting"
log "Clear index: $CLEAR_INDEX"
log "Static: $STATIC_DATA_DIR"
log "Build: $BUILD_DATA_DIR"
log "Node path: $NODE_PATH"

if [ ! -z "$CLEAR_INDEX" ]; then
  log "Deleting database at $COUCHDB_URL"
  if ! curl -fsS -X DELETE "$COUCHDB_URL"; then
    log "Error deleting database"
  fi
fi

log "Creating database at $COUCHDB_URL"
if ! curl -fsS -X PUT "$COUCHDB_URL"; then
  log "Database already exists at $COUCHDB_URL"
fi

# Submit data
node $NODE_PATH/scripts/deleteSnapsets.js $COUCHDB_URL
loadData $STATIC_DATA_DIR
loadData $BUILD_DATA_DIR
