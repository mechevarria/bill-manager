#!/usr/bin/env bash

# # create network for other containers to communicate via name
docker network create app-net

docker run \
    --rm \
    --name=solr \
    --network app-net \
    -p 8983:8983 \
    solr:7.7.3 \
    solr-precreate \
    bills &

echo "Waiting for container to start"
sleep 15
echo "Copying configuration to container"

core=/opt/solr/server/solr/mycores/bills

docker exec solr bash -c "mkdir -p ${core}/lib"
docker exec solr bash -c "cp /opt/solr/dist/solr-dataimporthandler-*.jar ${core}/lib"
docker exec solr bash -c "cp /opt/solr/dist/solr-dataimporthandler-extras-*.jar ${core}/lib"
docker cp mysql-connector-java-*.jar solr:${core}/lib
docker cp data-config.xml solr:${core}/conf/
docker cp managed-schema solr:${core}/conf
docker cp solrconfig.xml solr:${core}/conf
docker cp solr:${core} ../
cd ..
mv bills solr-core
chmod -R 777 solr-core
cd -
docker stop solr
echo "Finished configuring solr and copied data"