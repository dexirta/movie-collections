# AI Notes

These entries record prompts, AI output, your edits, and rationale — per the ViaBill brief. The section **[Canonical implementation contract](#canonical-implementation-contract-for-reproducibility)** at the bottom is the **source of truth** for what must exist after checkout so tooling (or another engineer with AI) can recreate the same app without guessing.

---

## [Entry 1] NgRx scaffold and the Signal-Store-vs-classic-Store call

**Prompt:** "Scaffold features using `createActionGroup`, `createFeature`, and effects. Movies feature: TMDB popular + search + genres. Collections feature: CRUD + local persistence. Constraints: one effects file per domain, strict TypeScript, no `@ngrx/entity`, brief mandates classic actions/reducers/selectors/effects."

**AI output:** Solid `createActionGroup` action names plus TMDB wiring. It also pushed `@ngrx/signals` Signal Store "because it's modern" and added a meta-reducer that JSON-stringified the entire root state on every action.

**My changes:** Kept classic `createFeature` for rubric compliance. Removed the meta-reducer entirely. Added a narrow `persist$` effect that fires only on the four collection-mutating actions and writes through an injected `STORAGE` token (`dispatch: false`). TMDB HTTP for **discovery** lives in `movies.effects.ts` only; `collections.effects.ts` does **not** inject `TmdbApiService`.

**Why:** Meta-reducer on every action would stringify state on every search keystroke. The targeted persist effect runs only when collections actually change. The injected `STORAGE` token is mockable in tests without touching `globalThis.localStorage`.

---

## [Entry 2] Reducer purity and where UUIDs are minted

**Prompt:** "Where should `crypto.randomUUID()` for a new collection live — reducer, action factory, or component?"

**AI output:** Suggested calling `crypto.randomUUID()` inside the reducer's `create` handler "because that's where the entity is born."

**My changes:** Rejected. UUIDs are minted at the dispatch site through an injected `ID_GENERATOR` (`store.dispatch(CollectionsActions.create({ id: createId(), name }))`). The reducer takes the id from the action props.

**Why:** Reducers must be pure for replay and snapshot testing. Randomness inside a reducer breaks the `(state, action) → state` contract NgRx tooling assumes.

---

## [Entry 3] TMDB search: discovery (NgRx) vs collection-detail add-dialog (component)

**Prompt:** "Write search that debounces, cancels stale requests, and handles errors without killing the stream."

**AI output:** For NgRx search: `debounceTime` → `distinctUntilChanged` → `switchMap`. Often bundled with `retryWhen` / per-status failure actions.

**My changes — Movies (`/movies`):** Kept `debounceTime(300)` + `distinctUntilChanged` on `searchControl` via `toDebouncedFormValueSignal` (`shared/debounced-form-value.ts`). An `effect` dispatches `MoviesActions.searchSubmit`. `movies.effects.ts` uses `ofType(searchSubmit)` → trim → empty query falls back to `loadPopular()`, else `switchMap(tmdb.searchMovies)` with **inner** `catchError` → `discoveryFailure`. No `retryWhen`; one string error channel.

**My changes — Collection detail (`CollectionDetail`):** Did **not** add NgRx actions or `collections.effects` for TMDB. The add-movie dialog uses the same debounced helper, then `toObservable(debouncedSearch).pipe(filter, switchMap)` where each non-empty trimmed query emits `concat(of(loading snapshot), tmdb.searchMovies(trimmed, 1).pipe(map success, catchError → error snapshot)))`, consumed with `toSignal(..., { initialValue: idle })`. Mapper/errors reuse `toErrorMessage` from `core/tmdb-mappers.ts`. Unit tests **provide a mock `TmdbApiService`** (`collection-detail.spec.ts`).

**Why:** Discovery benefits from global loading/error in the store. Detail-dialog search is ephemeral UI-only state; keeping it local avoids polluting the collections slice and matches “what belongs in NgRx vs components.” Interview defence vs literal brief wording: point here + `ARCHITECTURE.md`.

---

## [Entry 4] Detail view: redirect-to-list-with-query-param vs real route

**Prompt:** "The brief asks for a Collection Detail View at `/collections/:id`. I'm tempted to redirect to `/collections?open=:id` and use an accordion. Is that defensible?"

**AI output:** "Yes, accordion-on-list is denser UX and you can document the trade-off."

**My changes:** Rejected. Implemented `CollectionDetail` at `/collections/:id` with `withComponentInputBinding()` so `id` is `input.required<string>()`. Bookmarkable URL, back link, `<h1>`, add-from-TMDB dialog, per-card remove.

**Why:** Core Feature 3 in the brief is explicit about that screen. A query-param accordion reads as scope dodge to a strict reviewer.

---

## [Entry 5] Tests: `it.each`, object mothers, and coverage scope

**Prompt:** "Write reducer / selector / component / effect tests. Jest. Mock TMDB — never live HTTP in unit tests."

**AI output:** Heavy `HttpClientTestingModule`, `done` callbacks, copy-pasted initial state objects.

**My changes:** Centralized mothers in `testing/fixtures.ts` (`tmdbMovie`, `collection`, `collectionMovie`, `moviesState`, `collectionsState`). Used `firstValueFrom` for effects. `provideMockStore` for components; `provideMockActions` + `ReplaySubject` for effects. **Collection-detail** mocks `TmdbApiService`, not NgRx search actions. Jest `coverageThreshold`: `state/` and `core/` ≥ 80% lines/statements/functions, global ≥ 65%; `collectCoverageFrom` includes `src/app/**/*.ts` minus specs and `testing/`.

**Why:** `done` hides timeouts. Shared fixtures keep tests readable. Coverage must include feature components so the threshold reflects real logic, not only `state/`.

---

## Canonical implementation contract (for reproducibility)

Use this checklist when regenerating or reviewing the repo. Deviations should be intentional and documented.

| Area | Must match |
|------|------------|
| **Angular** | Standalone components, zoneless (`provideZonelessChangeDetection`), `withComponentInputBinding()` for `:id` on detail. |
| **Collections state** | `CollectionsState` = `{ collections: readonly Collection[] }` only — no transient TMDB/search fields. |
| **Collections actions** | `Hydrate`, `Create`, `Delete`, `Add Movie`, `Remove Movie` — **no** add-search / TMDB actions. |
| **Collections effects** | `hydrate$` (init → read `STORAGE` → `hydrate`), `persist$` (four mutations → `writeCollections`) — **no** TMDB. |
| **Collections extra selector** | `selectCollectionNamesByMovieId` only (no `selectMoviesByCollectionId` / `selectCollectionById` in the feature). Detail page derives movies via `selectCollections` + `computed` + `route id`. |
| **Movies feature** | Full discovery state + `movies.effects.ts` for all TMDB calls used by `/movies` (genres, popular, search, load more). |
| **Detail TMDB UI** | `collection-detail.ts`: `inject(TmdbApiService)` + debounced control + `toObservable`/`switchMap`/`concat` loading pattern described in Entry 3. |
| **Persistence** | `collections.storage.ts`: key `movie-collections`, `readCollections` / `writeCollections`, `STORAGE` injection token. |
| **New collection ids** | `ID_GENERATOR` token at dispatch; reducer never generates ids. |
| **Tests** | Jest; mock TMDB in effects (`TmdbApiService`) and in `collection-detail.spec.ts`; reducer + selector + component coverage as in `README.md` / `PLAN.md`. |

**Key files:** `src/app/app.config.ts` (store + both effect classes), `src/app/state/movies.feature.ts`, `src/app/state/collections.feature.ts`, `src/app/state/movies.effects.ts`, `src/app/state/collections.effects.ts`, `src/app/features/collections/collection-detail/collection-detail.ts`, `src/app/shared/debounced-form-value.ts`.
