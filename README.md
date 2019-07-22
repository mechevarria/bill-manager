bill-manager
=============

Angular client and Grails api application to manage monthly expenses/income

## Installation Steps

* Download and install [Ubuntu Server](https://ubuntu.com/download/server)

* Make sure timezone is local and not UTC to prevent database save/import errors

```bash
sudo dpkg-reconfigure tzdata
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

sudo ln -s /home/vmuser/bill-manager/client/dist /var/www/html/client

sudo systemctl restart apache2
```

### Install Tomcat 9

``` bash
sudo apt-get install -y tomcat9 tomcat9-admin

sudo systemctl status enable tomcat9
```

* Edit `/var/lib/tomcat9/conf/tomcat-users.xml`

* Insert into the **tomcat-users** element

```xml
<role rolename="manager-gui" />
<user username="tomcat" password="tomcat" roles="manager-gui" />
```

```bash
sudo usermod vmuser -a -G tomcat
```

### Install MySQL

```bash
sudo apt-get install -y mysql-server

sudo systemctl enable mysql

sudo usermod vmuser -a -G mysql
```

* configure root user

```bash
sudo -u root -p
```

```sql
DROP USER 'root'@'localhost';

CREATE USER 'root'@'%' IDENTIFIED BY 'root';

GRANT ALL PRIVILEGES on *.* to 'root'@'%' WITH GRANT OPTION;

FLUSH PRIVILEGES;
```

* Setup the database and app user

```bash
mysql -u root -p < config.sql
```
* Edit `/etc/mysql/mysql.conf.d/mysqld.cnf` to allow remote access

```
# bind-address          = 127.0.0.1
```

### Install Solr

* Download [solr-7.7.2.tgz](https://www.apache.org/dyn/closer.lua/lucene/solr/7.7.2/solr-7.7.2.tgz) (or latest version)

* Copy the archive to the root directory

```bash
sudo ./install_solr_service.sh ~/bill-manager/solr-7.7.2.tgz -u vmuser
```

#### Configure Solr
```bash
/opt/solr/bin/./solr create -c bills

mkdir /var/solr/data/bills/lib

cp /opt/solr/dist/solr-dataimporthandler-*.jar /var/solr/data/bills/lib

cp /opt/solr/dist/solr-dataimporthandler-extras-*.jar /var/solr/data/bills/lib

cp mysql-connector-java-*.jar /var/solr/data/bills/lib

cp data-config.xml /var/solr/data/bills/conf/
```

* Edit `/var/solr/data/bills/conf/solrconfig.xml` and the code below to the **config** element

```xml
<requestHandler name="/dataimport" class="org.apache.solr.handler.dataimport.DataImportHandler">
  <lst name="defaults">
    <str name="config">data-config.xml</str>
  </lst>
</requestHandler>
```

* Edit `/var/solr/data/bills/conf/managed-schema` and after this line

```xml
<field name="_text_" type="text_general" indexed="true" stored="false" multiValued="true" />
```

* Insert this code block

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

### Deploy Grails REST API

* Follow the sdkman instructions [here](https://www.grails.org/download.html)

* Inside the **grails-api** directory, build a tomcat deployable war `grails war`

* Add context to deploy war from the `grails-api/build` directory
```bash
sudo cp api.xml /var/lib/tomcat9/conf/Catalina/localhost/
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
npm install -g grunt-cli

npm install -g bower

npm install

bower install

grunt build
```
