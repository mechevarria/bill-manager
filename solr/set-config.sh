conf=$(pwd)/bills/conf
lib=/opt/solr/dist
db=mysql*.jar
solr_home=/var/solr/data/bills
solr_conf=${solr_home}/conf
solr_lib=${solr_home}/lib

files=("data-config.xml" "managed-schema" "solrconfig.xml")

for file in "${files[@]}"; do
  ln -sf ${conf}/${file} ${solr_conf}
done

rm ${solr_lib}/*.jar
cp ${lib}/solr-dataimporthandler-*.jar ${solr_lib}
cp ${lib}/solr-dataimporthandler-extras-*.jar ${solr_lib}
cp ${db} ${solr_lib}
