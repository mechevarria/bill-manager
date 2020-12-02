#!/usr/bin/env bash

# create network for other containers to communicate via name
docker network create app-net

docker run \
    --rm \
    -d \
    --name=grails \
    --network app-net \
    -p 8080:8080 \
    quay.io/mechevarria/grails-api:latest