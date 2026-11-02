# Rick & Morty Character Explorer

An Angular 22 app for browsing every character from the [Rick & Morty API](https://rickandmortyapi.com). You can search characters by name, open a character to see the episodes they appear in, and switch between two simulated roles (Admin and Viewer).

```bash
npm install
npm start          # http://localhost:4200
npm run build      # production build -> dist/
npm test           # Vitest (no spec files yet, see "Possible next steps")
```

## Requirements → implementation

| Requirement                                            | Where / how                                                                                                                                                                                                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| View **all** characters, list **or** grid              | `components/character-list` pages through all 826 characters (42 API pages) with infinite scroll plus a "Load more characters" button, and has a Grid/List toggle                                                                                          |
| Name, status, species, gender, total episodes          | Character card. Total episodes = `character.episode.length`, so no extra request is needed                                                                                                                                                                 |
| Avatar (optional)                                      | `shared/components/avatar`: initials on a tint that stays the same for each character, with the API image (`NgOptimizedImage`, lazy-loaded) on top. Fixed size, so the layout doesn't jump, and no broken-image icon if it fails                           |
| Preserve selection state between navigation (optional) | The search term is in the URL. `StateService` keeps the characters loaded so far, the last selected character and the last search. When you come back, the same list is shown without re-fetching, and the selected card is scrolled into view and focused |
| Global search by name                                  | `shared/components/global-search` sits in the toolbar and updates `?name=` with a 350 ms debounce. It works from any page and stays in sync with back/forward                                                                                              |
| Details on a dedicated route                           | `/characters/:id`. Invalid or unknown ids show a "Character not found" state                                                                                                                                                                               |
| Episode table: name, air_date, episode                 | Semantic `<table>`, 10 episodes per page. All episodes come from **one** request: `/episode/1,2,3`                                                                                                                                                         |
| Client-side filtering by episode name                  | Free-text, case-insensitive, computed from a signal. Shows "X of Y match" and a no-match state with a Clear button                                                                                                                                         |
| Admin: all routes; Viewer: list only                   | `roleGuard` (functional `CanActivateFn`) reads `route.data.roles`                                                                                                                                                                                          |
| Clear error on denial                                  | `/restricted` is a 403 page that shows the blocked URL, with "Back to Character list" and "Switch to Admin" (which goes straight to the blocked page)                                                                                                      |
| Roles simulated by a hardcoded value                   | `DEFAULT_ROLE = 'admin'` in `auth.service.ts`. A toolbar toggle lets you switch roles to see the rules in action                                                                                                                                           |

## Key decisions & rationale

**Modern Angular only.** The app uses standalone components, zoneless change detection, signals, `computed` and `linkedSignal`, the built-in control flow (`@if`/`@for`/`@let`), functional guards, lazy-loaded routes and Vitest. These are the current Angular defaults. They give less boilerplate and more predictable rendering than NgModules plus Zone.js.

**`httpResource()` for data fetching.** `RmApiService` wraps each endpoint in an `httpResource()` whose URL is a function of signals (search request, id, loaded character). When a signal changes, the request runs again automatically, and an outdated request still in flight is cancelled. That replaces `switchMap`/`subscribe`/`unsubscribe` boilerplate. Loading, error and value states come from the resource, so templates read directly from it. Resources are created in the calling component, so they are destroyed with it. There's no global store because the data is all read-only and comes from the API on demand.

**URL as the source of truth for the search.** The search term lives in the `name` query param, bound to a component input with `withComponentInputBinding()`. As a result, refreshing the page, sharing a link, and using the browser's back/forward buttons all restore the search. State that doesn't belong in a link (the characters loaded so far, the last selected card, the last search for the details page's "Back" link) lives in `StateService`, a root signal service, so coming back from a details page shows the same list at the same scroll position.

**Preferences survive a refresh.** The current role and the grid/list choice are saved to `sessionStorage` and validated when read back. If storage isn't available (e.g. private mode), the app keeps working in memory.

**Infinite scroll + "Load more" for "ALL characters".** The API returns 20 items per page. Fetching all 42 pages up front would mean about 42 requests before anything shows. Instead the first page shows straight away, and each next page is appended when the bottom of the list scrolls into view (an `IntersectionObserver`), with a "Load more characters" button as a fallback. It works together with the API's `name` filter, and a page is never appended to the wrong search.

**The API's 404 means "no results".** The API answers a search with no matches with a 404. The app treats that as an empty state, not an error. Real failures show a separate error panel with a Retry button, both for the first page and for later pages.

**Episodes in a single batched request.** The `/episode/{id}` endpoint accepts a comma-separated list of ids. A character like Rick appears in 51 episodes, so this is 1 request instead of 51. The single-id response is a plain object instead of an array, and `normalizeEpisodes()` handles that case.

**Authorization lives in route guards, not templates.** Hiding links isn't security. The guard is what actually blocks access, and the UI only gives hints (a lock icon and a Viewer banner). If you change role while you're on a restricted page, the guard runs again (`runGuardsAndResolvers: 'always'` plus a same-URL reload), so a demoted user is moved off the page right away. Switching to Admin on `/restricted` retries the blocked page.

**Angular Material, styled to the UX spec.** Material provides the icons and progress bars. The visible UI follows the design in the UX spec PDF (desktop, tablet and phone): a light theme with one green accent, Inter and Space Grotesk, shared design tokens in `src/styles.scss`, and plain semantic HTML for the table, fields and buttons so they match the spec exactly. Layouts change at 600 px and 1024 px: on phone the role switch becomes a dropdown, list rows become cards and the episodes table becomes a stacked list.

**Accessibility.** The app includes a skip link, `role="status"` live regions for result counts, `role="alert"` on error panels, and cards that are real links (keyboard and middle-click work). Focus moves to the new page's heading after navigation, and back to the opened card when returning to the list. It also uses visible focus rings, a text label next to every status colour, labelled icon-only buttons, page titles per route (the details page uses the character's name), and respects `prefers-reduced-motion`.

## Structure

```
src/app/
  app.ts / app.html              toolbar, role switch, focus management
  app.routes.ts                  lazy routes + role data
  core/
    api/rm-api.utils.ts          pure helpers (episode ids, normalize, filter, 404 check)
    guards/role.guard.ts         functional CanActivateFn
    models/                      API types
    services/
      rm-api.service.ts          httpResource-based API access
      auth.service.ts            role signal (hardcoded default, sessionStorage)
      state.service.ts           list cache, selection, view mode
      app-title.strategy.ts      "<page> · Rick & Morty Character Explorer"
  components/
    character-list/              grid/list, infinite scroll / load more, empty/error states
    character-details/           profile + filterable, paginated episode table
    restricted/                  403 access-denied page
    not-found/                   404 page
  shared/components/
    global-search/               toolbar search -> ?name=
    avatar/                      initials + lazy image
    status-badge/
  utils/                         constants (URLs, storage keys) + small helpers
```

## Possible next steps

- TODO
