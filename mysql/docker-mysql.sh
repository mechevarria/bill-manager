#!/usr/bin/env bash

# create directory for mysql data
mkdir -p ../mysql-data

# create network for other containers to communicate via name
docker network create app-net

docker rm mysql

docker run \
    --name=mysql \
    --network app-net \
    --mount type=bind,src=${HOME}/git/bill-manager/mysql-data,dst=/var/lib/mysql \
    -e MYSQL_ROOT_PASSWORD=root \
    -e MYSQL_DATABASE=billDb \
    -e MYSQL_USER=app \
    -e MYSQL_PASSWORD=app \
    -e TZ=America/New_York \
    -p 3306:3306 \
    mysql/mysql-server:latest