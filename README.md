bill-manager
=============

Angular client and Grails api application to manage monthly expenses/income

## Installation Steps

* Download and install [Ubuntu Server](https://ubuntu.com/download/server)

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

mysql_secure_installation
```

* Say no to disabling any options but set a **root** password

* Setup the database and app user

```bash
sudo mysql -u root -p < config.sql
```
* Edit `/etc/mysql/mysql.conf.d/mysqld.cnf` to allow remote access

```
# bind-address          = 127.0.0.1
```