#!/usr/bin/env bash

cd mysql
./docker-mysql.sh

cd ../solr
./docker-solr.sh

cd ../grails-app
./docker-grails.sh

cd ../client
./docker-nginx.sh