#!/usr/bin/env bash

HOST=mysql

# create network for other containers to communicate via name
docker network create app-net

docker run \
    --rm \
    -d \
    -e HOST=$HOST \
    --name=springboot \
    --network app-net \
    -p 8080:8080 \
    quay.io/mechevarria/springboot-billmanager:latest