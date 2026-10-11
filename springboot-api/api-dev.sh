#!/usr/bin/env bash

cd "$(dirname "$0")" || exit 1

./mvnw spring-boot:run
