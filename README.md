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

### Install node.js

```bash
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

sudo apt-get install -y nodejs
```

### Setup MySQL docker Service

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


### Install Solr docker Service

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

### Deploy Grails docker API

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

### Setup nginx docker service

* Build client project

```bash
npm install
npx bower install
npx grunt build
```

* Build the nginx container from the client build output in `./client/dist`

```bash
client/docker-build.sh
```

* Make sure the client runs with
```bash
client/docker-nginx.sh
```

* The application will be running on [http://localhost](http://localhost)

* Install and enable the service

```bash
sudo cp client/docker.nginx.service /etc/systemd/system

sudo systemctl daemon-reload

sudo systemctl enable docker.nginx

sudo systemctl start docker.nginx
```

#### AngularJS client development

* Inside the `client` directory run
```bash
npx grunt serve
```

* A livereload development server will be available at [http://localhost:9000](http://localhost:9000)