CONF=$(pwd)/bills/conf
LIB=/opt/solr/dist
DB=~/git/bill-manager/db/*.jar
SOLR_HOME=/var/solr/data/bills
SOLR_CONF=$SOLR_HOME/conf
SOLR_LIB=$SOLR_HOME/lib

FILES=("data-config.xml" "managed-schema" "solrconfig.xml")

for FILE in "${FILES[@]}"; do
  ln -sf $CONF/$FILE $SOLR_CONF
done

rm $SOLR_LIB/*.jar
cp $LIB/solr-dataimporthandler-*.jar $SOLR_LIB
cp $LIB/solr-dataimporthandler-extras-*.jar $SOLR_LIB
cp $DB $SOLR_LIB
