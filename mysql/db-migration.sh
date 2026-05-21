#!/usr/bin/env bash

# Adds AUTO_INCREMENT to all entity id columns.
# Required when restoring a database created before the switch from
# GenerationType.AUTO to GenerationType.IDENTITY in Hibernate.
docker exec mysql /usr/bin/mysql -u root --password=root billDb -e "
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE bill            MODIFY id bigint NOT NULL AUTO_INCREMENT;
ALTER TABLE expense         MODIFY id bigint NOT NULL AUTO_INCREMENT;
ALTER TABLE income          MODIFY id bigint NOT NULL AUTO_INCREMENT;
ALTER TABLE detail          MODIFY id bigint NOT NULL AUTO_INCREMENT;
ALTER TABLE default_expense MODIFY id bigint NOT NULL AUTO_INCREMENT;
ALTER TABLE default_income  MODIFY id bigint NOT NULL AUTO_INCREMENT;
ALTER TABLE defaults        MODIFY id bigint NOT NULL AUTO_INCREMENT;
ALTER TABLE owner           MODIFY id bigint NOT NULL AUTO_INCREMENT;
SET FOREIGN_KEY_CHECKS=1;
-- Reset counters to max(id)+1 in case data was restored with explicit IDs
ALTER TABLE bill            AUTO_INCREMENT = 1;
ALTER TABLE expense         AUTO_INCREMENT = 1;
ALTER TABLE income          AUTO_INCREMENT = 1;
ALTER TABLE detail          AUTO_INCREMENT = 1;
ALTER TABLE default_expense AUTO_INCREMENT = 1;
ALTER TABLE default_income  AUTO_INCREMENT = 1;
ALTER TABLE defaults        AUTO_INCREMENT = 1;
ALTER TABLE owner           AUTO_INCREMENT = 1;
"
