#!/usr/bin/env bash

data=$HOME/mysql-data

mkdir -p $data

docker run \
    --name=mysql \
    --restart=always \
    --mount type=bind,src=$data,dst=/var/lib/mysql \
    -e MYSQL_ROOT_PASSWORD=root \
    -e MYSQL_DATABASE=billDb \
    -e MYSQL_USER=app \
    -e MYSQL_PASSWORD=app \
    -p 3306:3306 \
mysql/mysql-server:latest
