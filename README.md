bill-manager
=============

Angular client and Spring Boot API for managing monthly expenses/income with a MySQL backend. Full-text search across incomes, expenses, and credit-card details is served by the Spring Boot API using MySQL `FULLTEXT` indexes (no separate search service).

## Prerequisites

* [Docker](https://docs.docker.com/install/linux/docker-ce/ubuntu/) — used to run MySQL, the Spring Boot API, and the nginx-served client
* Java 17 JDK — required to build the Spring Boot 4.x API
* Node.js (current LTS) — required to build the AngularJS client
* MySQL 8 — provided via the Docker container; required for the `FULLTEXT` indexes that the API auto-creates on startup

* Make sure the user that will run docker is in the docker group. In this example, the username is `vmuser`

```bash
sudo usermod vmuser -a -G docker
```

### Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

sudo apt-get install -y nodejs
```

### Setup MySQL docker

* Test that mysql docker will work with

```bash
mysql/docker-mysql.sh
```

* After making sure the container runs you can stop the container with
```bash
docker stop mysql
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

### Deploy Springboot docker API

* Inside the **springboot-api** directory, build a container with
```bash
./docker-build.sh
```

* Verify the container runs with
```bash
./docker-springboot.sh
```

On first startup against a populated database, the API creates three `FULLTEXT` indexes — on `income.description`, `expense.name`, and `detail.description`. Creation is idempotent; subsequent startups are no-ops.

#### Local Springboot development
* Use the following script to run locally against a mysql docker container

```bash
./local-run.sh
```

#### Search behavior note

The `/search` endpoint uses MySQL boolean-mode `MATCH ... AGAINST`. MySQL's default `innodb_ft_min_token_size` is 3, so single- and two-character search terms are ignored. If you need to search short vendor abbreviations (e.g. "TJ", "BJ"), lower that variable in MySQL config and rebuild the indexes.

#### CSV import note

Credit-card CSV parsing happens in the API at `POST /detail/parse` using Apache Commons CSV (handles RFC 4180 quoted fields with embedded newlines). The client uploads the file as multipart; no parsing logic runs in the browser. Sample Amex CSVs for manual testing live in `springboot-api/test-data/`.

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

#### AngularJS client development

* Inside the `client` directory run
```bash
npx grunt serve
```

* A livereload development server will be available at [http://localhost:9000](http://localhost:9000)

## Run all the containers
* After configuring and verifying the containers run, use the following scripts to run and stop all the containers
```bash
./docker-run-all.sh
./docker-stop-all.sh
```
