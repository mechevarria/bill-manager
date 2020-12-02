#!/usr/bin/env bash

# create network for other containers to communicate via name
docker network create app-net

docker run \
    --rm \
    -d \
    --name=solr \
    --network app-net \
    --mount type=bind,src=${PWD}/../solr-core,dst=/opt/solr/server/solr/mycores/bills \
    -p 8983:8983 \
    solr:7.7.3 \
    solr-precreate \
    bills