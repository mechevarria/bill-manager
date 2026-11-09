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
├── .env.example          # Template for .env (PrimeUI license key for Docker builds)
├── docker-build.sh       # Build the API and UI images
├── docker-up.sh          # Start the full stack
├── docker-down.sh        # Stop the full stack
└── mysql-up.sh           # Start only MySQL (for local development)
```

## Prerequisites

* [Docker](https://docs.docker.com/get-docker/) with Docker Compose. Needed for everything: MySQL always runs in a container.
* For local development only (not needed to run the Docker stack):
  * Java 25 JDK, to run the API with the Maven wrapper
  * Node.js `^22.22.2` or `>=24.15.0`, to run the Vite dev server
* A free [PrimeUI Community License](https://primeui.dev/licenses/community) key. PrimeVue 5 is commercially licensed and shows an "invalid license" banner without a key. See [PrimeUI license key](#primeui-license-key).

On Linux, make sure your user is in the `docker` group:

```bash
sudo usermod "$USER" -a -G docker
```

## Run with Docker

Create `.env` in the repo root from `.env.example` and add your PrimeUI license key (see [PrimeUI license key](#primeui-license-key)). Then build the images and start the stack:

```bash
./docker-build.sh
./docker-up.sh
```

| Service | Container | URL |
|---|---|---|
| UI (nginx) | `primevue` | [http://localhost:8000](http://localhost:8000) |
| API | `springboot` | Not published on the host. Reached only through nginx at `/api/*` |
| MySQL | `mysql` | `localhost:3306` (database `billDb`, user `app` / `app`) |

Containers start in order: MySQL first, then the API once MySQL is healthy, then the UI once the API is healthy. nginx proxies `/api/*` to `springboot:8080` on the internal `app-net` network, so the API needs no host port. That avoids a clash with NAS admin consoles (QNAP QTS uses port 8080). MySQL data is persisted in `./mysql-data`.

When you're done:

```bash
./docker-down.sh
```

Rerun `./docker-build.sh` after code changes to rebuild the images.

### Container tuning

The stack is tuned to run on a small NAS (target: QNAP TS-462A, Intel Celeron N5095, 4 GB RAM):

* **API image:** a Java 25 JRE (Alpine) with Serial GC, a 512 MB max heap, compact object headers, and C1-only JIT (`-XX:TieredStopAtLevel=1`) for lower CPU and memory use. It runs as a non-root `app` user, and `springboot-api/.dockerignore` keeps `target/` out of the build context.
* **MySQL:** the official `mysql:8.4` LTS image, started with `--performance-schema=OFF` and `--innodb-buffer-pool-size=128M`, which saves roughly 300–400 MB compared with the defaults.
* **Logs:** every service uses the `json-file` driver capped at 2 × 10 MB, defined once as the `x-logging` anchor in `docker-compose.yaml`.

### Deploying on a QNAP NAS

* Start the stack from a shell in the repo folder with `./docker-up.sh`. If you create the app through Container Station's web UI instead, it copies the compose file into its own folder. Relative paths (`./mysql-data`) and `.env` then resolve there, which gives you an empty database and no license key. Use absolute paths in that case.
* Moving from the old `mysql/mysql-server` image to `mysql:8.4` upgrades the data files in place on first start, and the upgrade can't be undone. Take a fresh `./mysql/db-backup.sh` before switching. The upgrade also changes the owner of `mysql-data/` from user 27 to user 999.

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

   The Vite dev server runs at [http://localhost:5173](http://localhost:5173) and proxies `/api/*` to the API on `localhost:8080`. Put your PrimeUI license key in `primevue-ui/.env.local` first (see below).

Stop MySQL with `./docker-down.sh` when you're finished.

### PrimeUI license key

PrimeVue 5 checks for a license key offline when it starts. Without one, every component shows an "invalid license" banner. A free Community License covers personal projects; renew it each year.

Vite builds `VITE_*` variables into the bundle at build time, so the key is supplied in two places:

| Where | File | Contents |
|---|---|---|
| Local dev (`npm run dev`) | `primevue-ui/.env.local` (template: `.env.local.example`) | `VITE_PRIMEUI_LICENSE=<key>` |
| Docker image | `.env` in the repo root (template: `.env.example`) | `PRIMEUI_LICENSE=<key>` |

Compose passes `PRIMEUI_LICENSE` into the UI image as the `VITE_PRIMEUI_LICENSE` build argument, and `src/main.ts` hands it to PrimeVue's `license` option. Both files are git-ignored, and `.env*.local` is excluded from the Docker build context. Rebuild the UI image after you change the key; restarting the container isn't enough. The key ends up in the browser bundle, which is how PrimeUI's offline check is designed, so don't expose the app publicly.

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

## Frontend architecture

The UI is built on PrimeVue 5 with the **Lara** theme from `@primeuix/themes`, set up the way the official [`vite-quickstart`](https://github.com/primefaces/primevue-examples/tree/main/vite-quickstart) example does it. The goal is to use the theme and its components as they are, with as little custom CSS as possible.

* **Theme:** `definePreset(Lara, { semantic: { primary: palette('{cyan}') } })` in `src/main.ts`. Everything else is Lara's defaults, including table headers, striped rows, and spacing.
* **Dark mode:** the `.app-dark` class on `<html>` (PrimeVue `darkModeSelector`), toggled from the top bar and remembered in `localStorage`. Lara's colors use CSS `light-dark()`, so both modes come from the same tokens.
* **No hardcoded colors or sizes:** components use only `--p-*` theme variables, such as `--p-text-color`, `--p-content-background`, `--p-highlight-*`, `--p-typography-*` and `--p-<palette>-<shade>`. There are no hex or rgb literals anywhere in `src/`.
* **Owner colors:** `src/utils/ownerColors.ts` maps each owner's color name to a theme palette, using the same rules Lara uses for its primary color. Solid colors (bars, swatches) use the `500` shade in light mode and `400` in dark mode. Row and column backgrounds use the solid `50` shade in light mode and `400` at 16% opacity in dark mode.
* **Charts:** Chart.js can't read `light-dark()` values, so `ChartView` resolves theme variables to concrete colors before passing them to the charts.
* **App shell (`App.vue`):**
  * **Desktop:** a full-height sidebar with the brand and a caret toggle that collapses it to icons. Hovering over the collapsed sidebar expands it temporarily.
  * **Mobile:** below 992px, the sidebar is replaced by a PrimeVue `Drawer` opened from the top bar.
  * **Navigation:** `components/AppMenu.vue`, a PrimeVue `Menu` with router links, shared by the sidebar and the Drawer.
  * **Layout values:** sizes are CSS variables on `.layout-wrapper`.
* **Pages:** stacked PrimeVue `Card`s. Each Card's `#title` provides the heading, so title typography and padding come from the theme. Actions live in a `Toolbar` in the first Card. All `DataTable`s use `size="small"` and `striped-rows`.
* **Icons:** PrimeIcons only.

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
