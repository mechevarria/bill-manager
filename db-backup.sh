#!/usr/bin/env bash

mysqldump -u root -p billDb | gzip -v > ../billDb.sql.gz

# Backup
# docker exec mysql /usr/bin/mysqldump -u root --password=root billDb | gzip -v > ../billDb.sql.gz