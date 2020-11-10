bill-manager
=============

Angular client and Grails api application to manage monthly expenses/income

## Installation Steps

* Download and install [Ubuntu Server](https://ubuntu.com/download/server)

* Make sure timezone is local and not UTC to prevent database save/import errors

```bash
sudo dpkg-reconfigure tzdata
```

* Install [docker-ce](https://docs.docker.com/install/linux/docker-ce/ubuntu/)

* Make sure the user that will run docker is in the docker group. In this example, the username is `vmuser`

```bash
sudo usermod vmuser -a -G docker
```

### Install JDK

```bash
sudo apt-get install -y openjdk-8-jdk
```

* Set **JAVA_HOME** in `~/.profile`
```bash
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
```

### Install node.js

```bash
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -

sudo apt-get install -y nodejs

mkdir ~/.npm

mkdir ~/.npm-cache

npm config set prefix ~/.npm

npm config set cache ~/.npm-cache
```

* Add nodejs global modules to path in `~/.profile`

```bash
export PATH=${PATH}:~/.npm/bin
```

### Install Apache Web Server

```bash
sudo apt-get install -y apache2

sudo a2enmod proxy

sudo a2enmod proxy_http

sudo systemctl enable apache2

sudo cp 000-default.conf /etc/apache2/sites-available

sudo ln -s /home/vmuser/git/bill-manager/client/dist /var/www/html/client

sudo systemctl restart apache2
```

### Setup MySQL Docker Service

* Test that the mysql docker service will work with

```bash
mysql/docker-mysql.sh
```

* After making sure the container runs you can stop the container with 
```bash
docker stop mysql
```

* Verify the `ExecStart` line in `mysql/docker.mysql.service` is the same as the working command in `mysql/docker-mysql.sh`

* Install and enable the service

```bash
sudo cp mysql/docker.mysql.service /etc/systemd/system

sudo systemctl daemon-reload

sudo systemctl enable docker.mysql

sudo systemctl start docker.mysql
```

#### Optional: Backup data from MySQL

* Run the export script

```bash
./mysql/db-backup.sh
```

* `billDb.sql.gz` will be located in the directory above `bill-manager`

#### Optional: Restore data from MySQL Export

* Make sure `billDb.sql.gz` is located in the directory above `bill-manager`

* Run the restore script

```bash
./mysql/db-restore.sh
```


### Install Solr Docker Service

* Configure the container core directory with 
```bash
./solr/solr-configure.sh
```

* Verify the `ExecStart` line in `solr/docker.solr.service` is the same as the working command in `solr/docker-solr.sh`

* Install and enable the service

```bash
sudo cp solr/docker.solr.service /etc/systemd/system

sudo systemctl daemon-reload

sudo systemctl enable docker.solr

sudo systemctl start docker.solr
```

#### Solr Configuration Details

* The `/opt/solr/server/solr/mycores/bills/conf/solrconfig.xml` has the code added to the **config** element

```xml
<requestHandler name="/dataimport" class="org.apache.solr.handler.dataimport.DataImportHandler">
  <lst name="defaults">
    <str name="config">data-config.xml</str>
  </lst>
</requestHandler>
```

* The `/opt/solr/server/solr/mycores/bills/conf/managed-schema` has after this line

```xml
<field name="_text_" type="text_general" indexed="true" stored="false" multiValued="true" />
```

* The following block added

```xml
<!-- ********** custom fields for bill-manager ********** -->
<field name="db_id" type="string" indexed="true" stored="true" />
<field name="item_date" type="pdate" indexed="true" stored="true" />
<field name="author" type="string" indexed="true" stored="true" />
<field name="description" type="text_general" indexed="true" stored="true" />
<field name="price" type="pfloat" indexed="true" stored="true" />
<field name="last_modified" type="pdate" indexed="true" stored="true" />
<field name="category" type="string" indexed="true" stored="true" />
 
<copyField source="author" dest="_text_" />
<copyField source="description" dest="_text_" />
<copyField source="category" dest="_text_" />
<!-- ********** end custom fields ********** -->
```

### Deploy Grails Docker API

* Inside the **grails-api** directory, build a container with
```bash
./docker-build.sh
```

* Verify the containers runs with
```bash
./docker-grails.sh
```

* Install and enable the service
```bash
sudo cp docker.grails.service /etc/systemd/system

sudo systemctl daemon-reload

sudo systemctl enable docker.grails

sudo systemctl start docker.grails
```

* View logs from stdout with
```bash
sudo journalctl -u docker.grails.service -f
```

#### Upgrade Grails

* Upgrading grails sometimes requires creating a new project
```bash
grails create-app grails-api --profile=rest-api
```

* Copy or Recreate domain classes if necessary. Example:
```bash
grails create-domain-class api.Bill
```

* Copy or Recreate controllers if necessary. Example:
```bash
grails create-controller api.Bill
```

* Copy **grails-app/init/grails/api/Bootstrap.groovy**

* Update **application.yaml** and **build.gradle**

### Deploy AngularJS client

* Inside the **client** directory run
```bash
npm install

npx bower install

npx grunt build
```
