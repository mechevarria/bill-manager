#!/usr/bin/env bash

mkdir -p /home/vmuser/mysql-data

docker run \
    --name=mysql \
    --mount type=bind,src=/home/vmuser/mysql-data,dst=/var/lib/mysql \
    -e MYSQL_ROOT_PASSWORD=root \
    -e MYSQL_DATABASE=billDb \
    -e MYSQL_USER=app \
    -e MYSQL_PASSWORD=app \
    -p 3306:3306 \
mysql/mysql-server:latest
