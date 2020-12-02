#!/usr/bin/env bash

# create network for other containers to communicate via name
docker network create app-net

docker rm nginx

docker run \
    --rm \
    -d \
    --name=nginx \
    --network app-net \
    -p 80:80 \
    quay.io/mechevarria/nginx-client:latest