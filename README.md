bill-manager
=============

A household bill-splitting app for tracking monthly income and expenses between two owners and working out who owes whom. It has a Vue 3 + PrimeVue frontend, a Spring Boot REST API, and a MySQL backend. Full-text search across incomes, expenses, and credit-card details is served by the API using MySQL `FULLTEXT` indexes (no separate search service).

## Project structure

```
bill-manager/
├── primevue-ui/          # Vue 3 + PrimeVue frontend (Vite dev server, nginx in Docker)
├── springboot-api/       # Spring Boot 4.1 REST API (Java 25)
├── mysql/                # Database backup / restore / migration scripts
├── docker-compose.yaml   # Full stack: mysql, springboot, primevue
├── docker-build.sh       # Build the API and UI images
├── docker-up.sh          # Start the full stack
├── docker-down.sh        # Stop the full stack
└── mysql-up.sh           # Start only MySQL (for local development)
```

## Prerequisites

* [Docker](https://docs.docker.com/get-docker/) with Docker Compose. Needed for everything: MySQL always runs in a container.
* For local development only (not needed to run the Docker stack):
  * Java 25 JDK, to run the API with the Maven wrapper
  * Node.js `^20.19.0` or `>=22.12.0`, to run the Vite dev server

On Linux, make sure your user is in the `docker` group:

```bash
sudo usermod "$USER" -a -G docker
```

## Run with Docker

Build the images, then start the stack:

```bash
./docker-build.sh
./docker-up.sh
```

| Service | Container | URL |
|---|---|---|
| UI (nginx) | `primevue` | [http://localhost:8000](http://localhost:8000) |
| API | `springboot` | [http://localhost:8080](http://localhost:8080) |
| MySQL | `mysql` | `localhost:3306` (database `billDb`, user `app` / `app`) |

Containers start in order: MySQL first, then the API once MySQL is healthy, then the UI once the API is healthy. nginx proxies `/api/*` to the API container. MySQL data is persisted in `./mysql-data`.

When you're done:

```bash
./docker-down.sh
```

Rerun `./docker-build.sh` after code changes to rebuild the images.

The API image runs on a Java 25 JRE tuned for low-memory hosts: Serial GC, a 512 MB max heap, compact object headers, and C1-only JIT (`-XX:TieredStopAtLevel=1`) for lower CPU and memory use.

## Local development

Run MySQL in Docker and run the API and UI directly on your machine for hot reload. Start each in its own terminal, in this order:

1. **MySQL.** From the repo root:

   ```bash
   ./mysql-up.sh
   ```

2. **API.** Connects to MySQL on `localhost:3306`:

   ```bash
   ./springboot-api/api-dev.sh
   ```

3. **UI.** Run `npm install` in `primevue-ui/` the first time, then:

   ```bash
   ./primevue-ui/ui-run.sh
   ```

   The Vite dev server runs at [http://localhost:5173](http://localhost:5173) and proxies `/api/*` to the API on `localhost:8080`.

Stop MySQL with `./docker-down.sh` when you're finished.

### API configuration

The API reads its database connection from environment variables, falling back to the local defaults:

| Variable | Default |
|---|---|
| `DB_HOST` (or `HOST`) | `localhost` |
| `DB_PORT` | `3306` |
| `DB_NAME` | `billDb` |
| `DB_USER` | `app` |
| `DB_PASSWORD` | `app` |

### Lombok note

The API uses Lombok (`@Getter`, `@Setter`, `@NoArgsConstructor`) on its entities and DTOs. JDK 23+ no longer runs annotation processors found on the classpath, so Lombok is declared explicitly under `annotationProcessorPaths` in the `maven-compiler-plugin` config in `pom.xml`. Don't remove that block, or the build fails with `cannot find symbol` errors for getters and setters.

### Search behavior note

On first startup against a populated database, the API creates three `FULLTEXT` indexes: on `income.description`, `expense.name`, and `detail.description`. Creation is idempotent, so later startups are no-ops.

The `/search` endpoint uses MySQL boolean-mode `MATCH ... AGAINST`. MySQL's default `innodb_ft_min_token_size` is 3, so search terms of one or two characters are ignored. If you need to search short vendor abbreviations (e.g. "TJ", "BJ"), lower that variable in the MySQL config and rebuild the indexes.

### CSV import note

Credit-card CSV parsing happens in the API at `POST /detail/parse`, using Apache Commons CSV (which handles RFC 4180 quoted fields with embedded newlines). The UI uploads the file as multipart; no parsing logic runs in the browser.

## Database backup and restore

These scripts need the `mysql` container to be running (`./mysql-up.sh` or `./docker-up.sh`). Run them from the repo root.

* **Backup.** Writes `billDb.sql.gz` to the directory above `bill-manager`:

  ```bash
  ./mysql/db-backup.sh
  ```

* **Restore.** Loads `billDb.sql.gz` from the directory above `bill-manager`:

  ```bash
  ./mysql/db-restore.sh
  ```

* **Migration.** Adds `AUTO_INCREMENT` to all entity id columns. You only need it after restoring a database created before the API switched to `GenerationType.IDENTITY`:

  ```bash
  ./mysql/db-migration.sh
  ```

## Versioning & releases

The whole project shares one [semantic version](https://semver.org/), managed automatically by [release-please](https://github.com/googleapis/release-please) (`.github/workflows/release-please.yml`).

### Commit messages

Commits to `master` must follow [Conventional Commits](https://www.conventionalcommits.org/). The prefix decides the version bump:

| Commit prefix | Example | Bump |
|---|---|---|
| `fix:` | `fix: correct owner balance rounding` | Patch (1.0.0 → 1.0.1) |
| `feat:` | `feat: add CSV export` | Minor (1.0.0 → 1.1.0) |
| `feat!:` or a `BREAKING CHANGE:` footer | `feat!: change bill API shape` | Major (1.0.0 → 2.0.0) |
| `chore:`, `docs:`, `refactor:`, `test:` | `docs: update readme` | No release |

### Release flow

1. Push commits to `master`.
2. release-please opens a **Release PR** (or updates the open one) with the next version and the `CHANGELOG.md` entries.
3. Merge the Release PR when you're ready to release. That creates the `vX.Y.Z` git tag and a GitHub Release, and bumps the version in:
   * `.release-please-manifest.json`
   * `springboot-api/pom.xml` (the `<version>` line marked `x-release-please-version`)
   * `primevue-ui/package.json` and `primevue-ui/package-lock.json`

Don't edit these versions by hand.

### One-time GitHub setup

In the repository's **Settings → Actions → General → Workflow permissions**, enable **Allow GitHub Actions to create and approve pull requests**. Without it, the workflow can't open the Release PR.
