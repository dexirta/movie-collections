# Movie Collections

Browse popular movies from TMDB, search by title, and group them into local collections that survive a page reload. Built on Angular 21 (zoneless), classic NgRx, PrimeNG, SCSS, and Jest.

## Stack

- Angular 21 (zoneless change detection by default)
- NgRx 21 — `createFeature`, `createActionGroup`, `concatLatestFrom`
- PrimeNG 21 with the Aura preset
- TypeScript ~6.0 strict mode, SCSS
- Jest 30 + `jest-preset-angular`
- ESLint 10 (flat **`eslint.config.mjs`**) — **`eslint`**, **`angular-eslint`**, **`typescript-eslint`**, **`@eslint/js`**, **`eslint-config-prettier`**; **`ng lint`** via **`@angular-eslint/builder`**
- Bun ≥ 1.3 as the package manager

## Prerequisites

- Node.js 24 LTS or newer
- [Bun](https://bun.sh)
- A free [TMDB](https://www.themoviedb.org/settings/api) v3 API key. The auth path uses `?api_key=…` so the v3 key is what you need.

## Setup

Per the assignment brief, keep the TMDB API key out of version control (e.g. **`.env`** and/or local env files). This repo git-ignores **`environment.ts`**, **`environment.prod.ts`**, and **`.env`**. Only the **`.example.ts`** templates are committed (placeholders, safe to share).

```bash
bun install
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
# edit both: replace YOUR_TMDB_API_KEY with your TMDB v3 key (same key is fine for dev + prod build)
```

`angular.json` swaps **`environment.ts`** → **`environment.prod.ts`** for production builds (`bun run build`). The running app reads the key via **`TmdbApiService`** from whichever file the build compiled in. If you use **`.env`** only, copy/sync values into these files locally — do **not** commit real keys. After cloning, run the two **`cp`** lines above before **`bun start`** or **`bun run build`**.

If a key was ever committed during development, rotate it in TMDB before sharing.

## Run

| Command                 | What it does                                 |
| ----------------------- | -------------------------------------------- |
| `bun start`             | dev server at <http://localhost:4200>        |
| `bun run build`         | production build                             |
| `bun run lint`          | ESLint (flat `eslint.config.mjs`, `ng lint`) |
| `bun run test`          | unit tests (Jest)                            |
| `bun run test:coverage` | tests with coverage                          |

> Use `bun run test`, not bare `bun test` — Bun's built-in test runner skips Jest config. `bunfig.toml` blocks the spec glob from Bun's runner so you cannot accidentally do this.

## Linting

- **Command:** `bun run lint` (same as `ng lint` — see `angular.json` → `projects.app.architect.lint`).
- **Config:** root **`eslint.config.mjs`** — ESLint **`defineConfig`** / **`globalIgnores`** (`eslint/config`), **`@eslint/js`** recommended, **`typescript-eslint`** recommended presets, **`angular-eslint`** TS + template (+ template accessibility), **`eslint-config-prettier`** last so Prettier and ESLint don’t fight.
- **Scope:** `lintFilePatterns` are **`src/**/_.ts`** and **`src/\*\*/_.html`** (inline templates processed via **`processInlineTemplates`\*\*).
- **Editor:** repo **`.vscode/settings.json`** enables ESLint and **`eslint.useFlatConfig`**; optional fix-on-save via **`source.fixAll.eslint`**.
- **Note:** With **TypeScript 6**, **`typescript-eslint`** may print a supported-version **warning** until a release officially widens the range — lint still runs.

## Folder structure

```
src/app/
├── core/                       # tmdb api, models, mappers
├── state/                      # ngrx: actions, feature (reducer + selectors), effects, storage token
├── features/
│   ├── movies/                        # `/movies` page (browse + search)
│   └── collections/
│       ├── collections-list/          # list page (overview + delete + create)
│       └── collection-detail/         # detail page (per-collection movie list + add/remove)
├── shared/
│   ├── poster-url.ts
│   ├── debounced-form-value.ts        # debounced FormControl → signal (search fields)
│   └── movie-card/                    # grid card; `removable` on collection detail
└── testing/fixtures.ts                # object mothers shared by all specs
```

## Tests

- `state/movies.feature.spec.ts` — reducer + extra selectors (`selectHasMore`, `selectIsLoading`)
- `state/collections.feature.spec.ts` — reducer (create / delete / add / dup-rejection / remove) + `selectCollectionNamesByMovieId`
- `state/movies.effects.spec.ts` — `loadGenresOnInit$`, `loadPopular$`, `search$`, `loadMore$` happy paths plus failure mapping
- `state/collections.effects.spec.ts` — hydrate and persist
- `core/tmdb-api.service.spec.ts` — HTTP shape and params
- `shared/poster-url.spec.ts` — `buildPosterUrl` null/empty/value handling
- `shared/movie-card/movie-card.spec.ts` — poster, membership tags, add/remove outputs
- `core/genre-labels.spec.ts` — `genreLabelFromIds` + `genreLabelsMapForCollectionMovies`
- `features/collections/collections-list/collections-list.spec.ts` — create dispatch, delete confirmation, detail-route link, and create-dialog click path persists to storage
- `features/collections/collection-detail/collection-detail.spec.ts` — name render, back link, remove, add, already-added, and TMDB add-dialog search (service calls + loading/error/success)
- `app.spec.ts` — brand, nav, outlet, skip-link target

All specs use `it.each` with descriptive `$label`s and shared object mothers in `testing/fixtures.ts`. Coverage thresholds: `state/` ≥ 80%, `core/` ≥ 80%, global ≥ 65%.

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — design decisions and trade-offs (including TMDB boundary)
- [`AI_NOTES.md`](./AI_NOTES.md) — five narrative entries + **canonical implementation contract** (machine-checkable parity checklist)
- [`PLAN.md`](./PLAN.md) — stack versions, folder tree, routes, effects table, state shapes

## Reproducing this repo (manual or AI-assisted)

1. **Environment:** Copy both `.example.ts` files → `environment.ts` and `environment.prod.ts`; set `YOUR_TMDB_API_KEY` — keys stay local / git-ignored (`bun install` per Prerequisites).
2. **NgRx split:** Implement **`movies`** slice + **`movies.effects.ts`** as the **only** effects file that calls **`TmdbApiService`** for `/movies`. Implement **`collections`** slice with **five** action kinds only (see `collections.actions.ts`); **`collections.effects.ts`** = **`hydrate$`** + **`persist$`** only.
3. **Detail search:** Do **not** add collection search actions. In **`collection-detail.ts`**, debounce the dialog control → **`toObservable`** → **`switchMap`** → **`concat(of(loading), api.searchMovies(...))`** → **`toSignal`** with idle initial value; reuse **`toErrorMessage`**.
4. **Selectors:** **`collections`**: auto selectors + **`selectCollectionNamesByMovieId`**; derive current collection movies in the component from **`selectCollections`** + route **`id`**.
5. **Verify:** `bun run test` (or `npm test`), `bun run lint`, `bun run build`.

If anything disagrees with code, treat **`AI_NOTES.md`** → **Canonical implementation contract** + **`PLAN.md`** tables as authoritative.

## Rubric Mapping

- **Functional completeness (35%)** — `movies`, `collections-list`, `collection-detail`, plus persistence via `collections.effects`.
- **Code quality & NgRx (30%)** — actions/reducers/selectors/effects in `src/app/state`; TMDB discovery/search runs through `movies.effects`, while collection detail add-movie search calls `TmdbApiService` from the component.
- **Architecture & decisions (20%)** — rationale in `ARCHITECTURE.md` for structure, state boundaries, and persistence trade-offs.
- **AI collaboration (10%)** — critical integration records in `AI_NOTES.md`.
- **Documentation & tests (5%)** — setup docs + broad unit coverage (`bun run test`, `bun run test:coverage`) + lint (`bun run lint`).

## Out of scope (per the brief)

No backend, no multi-device sync, no entity adapter, no infinite scroll, no dark mode, no animations, no e2e tests. The brief calls these out explicitly.

## Submission checklist (assignment brief)

Use this when handing in the assignment. Items marked `[x]` reflect what this repository already satisfies locally; leave `[ ]` until you have done that step yourself (hosting, naming, git).

- [x] Public Git repository (GitHub, GitLab, Bitbucket).
- [x] No employing-company name in **this** README’s title or body — **also** confirm your **remote repository name** meets the PDF rule before submit.
- [x] All changes committed, branch pushed — **then** confirm tests pass, **lint is clean**, and **no build errors** (`bun run test`, `bun run lint`, `bun run build`).

**README.md**

- [x] Brief overview (1–2 sentences) — see title + intro paragraph.
- [x] Prerequisites — Node.js, Bun; TMDB key described.
- [x] Installation + build + run — Setup + Run tables.
- [x] How to run tests + coverage — Run table + Tests section + thresholds.
- [x] API key setup — Setup section + `.example.ts` → local `environment.ts` / `environment.prod.ts` (not committed).

**ARCHITECTURE.md** (or README section)

- [x] 2–3 design decisions (1–2 paragraphs each) — folder structure, NgRx vs component state, effects.
- [x] One trade-off reflection — dedicated route vs accordion; TMDB in component for detail search.

**AI_NOTES.md**

- [x] 3–5 entries (prompt, AI output, your changes, reasoning) — five entries + canonical contract appendix.

**Working codebase**

- [x] All core features implemented and functional per brief (movies, collections CRUD, persistence, detail view).
- [x] NgRx store with actions, reducers, selectors, effects (`movies` + `collections` features).
- [x] Unit tests: reducer(s), selector(s), component(s); coverage thresholds **>** brief’s ~60% logic bar (`jest.config.cjs`).
- [x] Responsive, usable UI (PrimeNG + SCSS layouts; mobile-first constraints in styles).
