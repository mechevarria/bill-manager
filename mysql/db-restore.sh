#!/usr/bin/env bash

gunzip < ../../*.sql.gz | mysql -u root -p billDb

# Restore
# gunzip < ../*.sql.gz | docker exec -i mysql /usr/bin/mysql -u root --password=root billDb