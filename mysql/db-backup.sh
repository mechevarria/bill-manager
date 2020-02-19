#!/usr/bin/env bash

docker exec mysql /usr/bin/mysqldump -u root --password=root billDb | gzip -v > ../billDb.sql.gz