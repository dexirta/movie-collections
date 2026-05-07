# Architecture

## 1. Folder structure

Two domain features (`movies/`, `collections/`) plus `core/` (HTTP, models, mappers, small utilities), `state/` (one NgRx feature per domain), `shared/` (cross-cutting UI: poster, movie-card, debounced form helper, focus helper), and `testing/` (object mothers). There are no barrel files; imports point at source files. Routing is registered once in `app.config.ts` (no per-route `provideState`) so both features stay alive across navigation and the persist effect does not race a teardown.

## 2. NgRx vs component state

**In the store**

- **`movies`:** genres map, discovery items, pagination (`page`, `totalPages`), `mode` (`popular` | `search`), `query`, `status`, `error`. Loading/error for the `/movies` page TMDB flows live here.
- **`collections`:** only `collections: readonly Collection[]`. Duplicate movie rejection is in the reducer. Custom selector **`selectCollectionNamesByMovieId`** powers “In: …” labels on the discovery grid. There is **no** NgRx selector for “movies in collection X”: `CollectionDetail` uses **`selectCollections`** plus a **`computed`** that `.find`s by route `id`. That is intentional (same data, no extra selector surface).

**Outside the store**

- Search **inputs** (`FormControl`) on `/movies` and in the collection-detail add dialog.
- Collection-detail **TMDB typeahead** state (loading / results / error / last trimmed query): **`signal`s fed by `toSignal(toObservable(debounced).pipe(...))`**, calling **`TmdbApiService`** directly — not actions/effects.
- Dialog open/close signals, create-collection name control, `Movies` “add to collection” dialog state, route param → **`input.required<string>()`** on detail.
- Detail-page genre strings: **`moviesFeature.selectGenres`** + **`genreLabelsMapForCollectionMovies`** (`core/genre-labels.ts`) inside **`computed`**s.

UUIDs for new collections come from **`ID_GENERATOR`** at dispatch time; the reducer stays pure.

## 3. Effects: two files, seven effects total

**`movies.effects.ts`** — `loadGenresOnInit$`, `loadPopularOnInit$`, `loadPopular$`, `search$`, `loadMore$`. Discovery search is debounced in **`Movies`**; the effect receives **`searchSubmit`** and uses **`switchMap`** + **`catchError`** inside the inner observable so one failure does not complete the outer stream. **`loadMore$`** uses **`concatLatestFrom`** for mode/query/page/totalPages.

**`collections.effects.ts`** — **`hydrate$`** (`ROOT_EFFECTS_INIT` → **`readCollections(STORAGE)`** → **`hydrate`**), **`persist$`** (four mutating actions → **`writeCollections`**, `dispatch: false`). No HTTP.

## Trade-offs

**Dedicated `/collections/:id` vs accordion-on-list.** Chosen: dedicated route — bookmarkable URL, clear `<h1>`, matches Core Feature 3 wording (grid + inline actions + back). Accordion would merge list/detail/create on one page; acceptable only if requirements shifted that way.

**TMDB for detail add-dialog in the component vs an effect.** Chosen: component-local stream into **`TmdbApiService`**. Keeps the **`collections`** slice persistence-shaped only and avoids transient search polluting DevTools/time-travel. Trade-off: a reviewer reading the brief literally may expect “all TMDB in effects”; defence is here, in **`AI_NOTES.md`** Entry 3, and the table **Canonical implementation contract**.
