# Shopping List

A small grocery shopping list app. Add what you need, tick it off at the store, and
the list sorts itself by what you buy most often.

Backed by [PocketBase](https://pocketbase.io) for data and Google sign-in, with a
lightweight [Alpine.js](https://alpinejs.dev) + TypeScript front end built by
[Vite](https://vitejs.dev) and styled with [Tailwind CSS](https://tailwindcss.com).

## Features

- **Need / Bought** tabs for the two halves of a shopping trip
- Search across item names and tags; tap a tag to filter by it
- Notes on needed items (quantity, variety) — cleared when the item is bought
- Frequency-aware sorting: recently and often-bought items float to the top
- Google sign-in via PocketBase's OAuth2 flow
- Mobile-optimised PWA (installable, home-screen icon, manifest)

## Development

```bash
npm install       # install dependencies
npm run dev       # dev server
npm run build     # production build -> dist/
npm run preview   # preview the production build
npm test          # run the test suite (Vitest + jsdom)
npm run lint      # Prettier + ESLint
npm run format    # rewrite files with Prettier
```

The project uses Nix flakes for a reproducible environment (`nix develop`, or
`direnv` via `.envrc`) with Node.js 24.

## Architecture

| Path                                       | Purpose                                                        |
| ------------------------------------------ | -------------------------------------------------------------- |
| `index.html`                               | Main page: list, search, filters, add form (Alpine directives) |
| `auth.html`                                | Login page — kicks off the OAuth2 redirect                     |
| `auth/redirect.html`                       | OAuth2 callback page — exchanges the code for a session        |
| `src/main.ts`                              | Alpine entry point; registers `groceryApp`                     |
| `src/app.ts`                               | Alpine component: UI state and actions                         |
| `src/pocketbase.ts`                        | All database reads/writes and the item/purchase model          |
| `src/auth.ts`                              | Session validation and the OAuth2 flow                         |
| `src/auth-init.ts`, `src/auth-redirect.ts` | Page entry points for the auth pages                           |
| `src/types.ts`                             | TypeScript interfaces for the data model                       |
| `tests/`                                   | Vitest suites (`app`, `auth`, `pocketbase`)                    |
| `static/`                                  | Static assets served verbatim (icons, manifest)                |

### Data model

- **`groceries_items`** — name, tags, `purchased`, optional `notes`, and a link
  to its purchases
- **`groceries_purchases`** — one row per time an item was bought
- Items are ranked by how many purchases they have in the last 30 days

Ticking an item off creates a `groceries_purchases` row and marks the item
`purchased`; un-ticking it drops it back to the Need tab without erasing history.

### Authentication

Sign-in is Google OAuth2 handled by PocketBase. On load the app confirms with the
server that the stored session is still accepted (`authRefresh`) rather than
trusting the token's local expiry alone; a rejected session is cleared and the user
is sent back to the login page.

## Deployment

`npm run build` emits a static bundle in `dist/` that can be served by any static
host; it talks to the PocketBase instance at `https://db.guymon.family`
(configured in `src/pocketbase.ts`).
