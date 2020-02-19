#!/usr/bin/env bash

gunzip < ../*.sql.gz | docker exec -i mysql /usr/bin/mysql -u root --password=root billDb