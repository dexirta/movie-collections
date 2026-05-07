# Implementation plan (as built — matches repo)

> Use this with **`AI_NOTES.md`** § *Canonical implementation contract*. Versions below reflect **`package.json`** / toolchain at freeze time.

## Stack

- Angular 21 (zoneless), NgRx 21 (`createFeature`, `createActionGroup`, `concatLatestFrom`)
- PrimeNG 21 + Aura (`providePrimeNG` in `app.config.ts`)
- TypeScript ~6.0 strict (`tsconfig.json`)
- Jest 30 + `jest-preset-angular` ^16
- Bun ≥ 1.3 (`packageManager` field); scripts use `npm run` compatible commands (`test`, `build`, `start`)

## Folder structure

```
src/app/
├── app.{ts,html,scss,spec.ts,config.ts,routes.ts}
├── core/
│   ├── tmdb-api.service.ts
│   ├── tmdb.models.ts
│   ├── tmdb-mappers.ts
│   ├── genre-labels.ts
│   ├── id-generator.ts
│   └── sort-collections.ts
├── state/
│   ├── movies.{actions,feature,effects}.ts (+ specs)
│   ├── collections.{actions,feature,effects}.ts (+ specs)
│   └── collections.storage.ts
├── features/
│   ├── movies/
│   └── collections/
│       ├── collections-list/
│       └── collection-detail/
├── shared/
│   ├── debounced-form-value.ts
│   ├── focus-on-init.ts
│   ├── poster-url.ts
│   ├── poster/
│   └── movie-card/
├── testing/fixtures.ts
└── environments/
```

## State shape

**`movies`**

```ts
{
  genres: Record<number, string>;
  mode: 'popular' | 'search';
  query: string;
  items: readonly TmdbMovie[];
  page: number;
  totalPages: number;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}
```

**`collections`**

```ts
{ collections: readonly Collection[] }
```

Detail-page TMDB search state is **not** in this slice — see `collection-detail.ts`.

**`Collection`**

```ts
{ id: string; name: string; movies: readonly CollectionMovie[] }
```

## Routing

| Path | Component |
|------|-----------|
| `/` | redirect → `/movies` |
| `/movies` | `Movies` |
| `/collections` | `CollectionsList` |
| `/collections/:id` | `CollectionDetail` (`id` = signal input) |
| `**` | redirect → `/movies` |

## Effects (exact responsibilities)

| File | Effect | Behaviour |
|------|--------|-----------|
| `movies.effects.ts` | `loadGenresOnInit$` | `ROOT_EFFECTS_INIT` → genre map or `{}` on error |
| | `loadPopularOnInit$` | dispatches `loadPopular` |
| | `loadPopular$` | TMDB popular page 1 |
| | `search$` | trim query; empty → `loadPopular`; else TMDB search page 1 |
| | `loadMore$` | next page popular or search from store snapshot |
| `collections.effects.ts` | `hydrate$` | read `STORAGE` → `hydrate` |
| | `persist$` | after create/delete/addMovie/removeMovie → write `STORAGE` |

**Debouncing:** `/movies` uses `toDebouncedFormValueSignal` + `effect` → `searchSubmit`. Detail dialog uses the same helper + `toObservable` → `switchMap` → `TmdbApiService` in the component.

## Actions (collections)

`Hydrate`, `Create`, `Delete`, `Add Movie`, `Remove Movie` — nothing for TMDB/search.

## Tests (inventory)

| Spec file | Focus |
|-----------|--------|
| `movies.feature.spec.ts` | reducer paths, `selectHasMore`, `selectIsLoading`, `selectGenreLabelsByMovieId`, `genreLabelsByMovieId` helper |
| `collections.feature.spec.ts` | reducer + **`selectCollectionNamesByMovieId`** |
| `movies.effects.spec.ts` | genres, popular, search trim/blank, load-more routing, failures |
| `collections.effects.spec.ts` | hydrate + persist |
| `collection-detail.spec.ts` | **`TmdbApiService` mock**, debounced search, loading/error/success, CRUD dispatches |
| Others | see `README.md` |

Coverage thresholds: `jest.config.cjs` — `state/` & `core/` high bars, global ≥ 65%.

## Accessibility & UI notes

- Skip link → `#main`; sticky header; focus helpers on page `<h1>` elements where implemented.
- Discovery empty copy uses `role="status"` where applicable; errors use `p-message` / `role="alert"`.
- Global `prefers-reduced-motion` reduction in `styles.scss`.
- Responsive layouts via flex/grid, `clamp()`, min tap targets in SCSS.

## Out of scope

Backend sync, `@ngrx/entity`, infinite scroll, dark mode, e2e (brief), SSR.
