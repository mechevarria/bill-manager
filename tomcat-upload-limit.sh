#!/bin/bash

FILE=/usr/share/tomcat8-admin/manager/WEB-INF/web.xml

SEARCH="52428800"
REPLACE="62428800"

sudo sed -i "s/${SEARCH}/${REPLACE}/g" ${FILE}