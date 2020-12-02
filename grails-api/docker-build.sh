#!/usr/bin/env bash

docker build -t quay.io/mechevarria/grails-api .

docker push quay.io/mechevarria/grails-api