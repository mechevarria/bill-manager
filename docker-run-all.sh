#!/usr/bin/env bash

cd /volume1/docker/bill-manager

cd mysql
./docker-mysql.sh

cd ../solr
./docker-solr.sh

cd ../springboot-api
./docker-springboot.sh

cd ../client
./docker-nginx.sh