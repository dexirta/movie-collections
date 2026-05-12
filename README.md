# Movie Collections

Browse popular movies from TMDB, search by title, and group them into local collections that survive a page reload. Built on Angular 21 (zoneless), classic NgRx, PrimeNG, SCSS, and Jest.

## Stack

- Angular 21 (zoneless change detection by default)
- NgRx 21 — `createFeature`, `createActionGroup`, `concatLatestFrom`
- PrimeNG 21 with the Aura preset
- TypeScript ~6.0 strict mode, SCSS
- Jest 30 + `jest-preset-angular`
- ESLint 10 (flat `eslint.config.mjs`) — `angular-eslint`, `typescript-eslint`, `@eslint/js`, `eslint-config-prettier`; `ng lint` via `@angular-eslint/builder`
- Bun ≥ 1.3 as the package manager

## Prerequisites

- Node.js 24 LTS or newer
- [Bun](https://bun.sh)
- A free [TMDB](https://www.themoviedb.org/settings/api) v3 API key (auth uses `?api_key=…`)

## Setup

Keep the TMDB API key out of version control. This repo git-ignores `environment.ts`, `environment.prod.ts`, `environment.secrets.ts`, and `.env`. Only the `.example.ts` templates are committed.

```bash
bun install
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
# In both files, replace YOUR_TMDB_API_KEY with your TMDB v3 key.
```

`angular.json` uses `environment.prod.ts` for production builds (`bun run build`). The app reads the key through `TmdbApiService` from the file the build compiled in. If you use `.env`, sync values into these files locally and do not commit real keys. If a key was ever committed, rotate it in TMDB before sharing.

## Run

| Command                 | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `bun start`             | dev server at [http://localhost:4200](http://localhost:4200) |
| `bun run build`         | production build                                             |
| `bun run lint`          | ESLint (`ng lint`)                                           |
| `bun run test`          | unit tests (Jest)                                            |
| `bun run test:coverage` | tests with coverage                                          |

Use `bun run test`, not bare `bun test` — Bun’s test runner skips Jest config. `bunfig.toml` blocks the spec glob from Bun’s runner so you cannot accidentally do this.

## Linting

- Command: `bun run lint` (same as `ng lint`; see `angular.json` → `projects.app.architect.lint`).
- Config: root `eslint.config.mjs` — `@eslint/js`, `typescript-eslint`, `angular-eslint` (TS + templates + accessibility), `eslint-config-prettier` last.
- Scope: `lintFilePatterns` cover `src/**/*.ts` and `src/**/*.html` (inline templates via `processInlineTemplates`).
- Editor: `.vscode/settings.json` enables ESLint flat config.

## Folder structure

```
src/app/
├── core/                       # tmdb api, models, mappers
├── state/                      # ngrx: actions, feature, effects, storage token
├── features/
│   ├── movies/                 # `/movies` page (browse + search)
│   └── collections/
│       ├── collections-list/   # list page (overview + delete + create)
│       └── collection-detail/  # detail page (per-collection movie list + add/remove)
├── shared/
│   ├── poster-url.ts
│   ├── debounced-form-value.ts
│   └── movie-card/
└── testing/fixtures.ts
```

(Abbreviated tree — full core file list is in [PLAN.md](./PLAN.md).)

## Tests

Paths below are under `src/app/`.

- `state/movies.feature.spec.ts`, `state/collections.feature.spec.ts` — reducers + extra selectors
- `state/movies.effects.spec.ts`, `state/collections.effects.spec.ts` — effects
- `core/tmdb-api.service.spec.ts`, `core/genre-labels.spec.ts`, `core/sort-collections.spec.ts`
- `shared/poster-url.spec.ts`, `shared/poster/poster.spec.ts`, `shared/movie-card/movie-card.spec.ts`
- `features/collections/collections-list/collections-list.spec.ts`, `features/collections/collection-detail/collection-detail.spec.ts`
- `app.spec.ts`

Many specs use `it.each` with descriptive `$label`s; shared object mothers live in `testing/fixtures.ts`.

**Coverage** — see [`jest.config.cjs`](./jest.config.cjs) for the full threshold matrix (per-metric, per-glob). In short: under `src/app/state/**` and `src/app/core/**`, lines/statements/functions are gated at **≥ 80%**; branches at **≥ 60%** (state) and **≥ 50%** (core). **Global** minimums are **65%** for lines/statements/functions and **50%** for branches. Those are **configured** gates; `bun run test:coverage` fails until collected coverage satisfies them.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — design decisions and trade-offs
- [AI_NOTES.md](./AI_NOTES.md) — AI collaboration entries and the canonical implementation contract (what the repo is intended to match)
- [PLAN.md](./PLAN.md) — routes, effects table, state shapes, test inventory notes

For detail beyond this README, use those files. If something conflicts on **facts** (versions, paths, thresholds), prefer **`package.json`**, **`jest.config.cjs`**, and the contract in **`AI_NOTES.md`**.

## Out of scope (per the brief)

No backend, no multi-device sync, no entity adapter, no infinite scroll, no dark/light **theme switcher** (PrimeNG Aura default preset only — no user-controlled appearance toggle), no animations, no e2e tests.
