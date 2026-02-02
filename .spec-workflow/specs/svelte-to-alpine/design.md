# Design Document: Svelte to Alpine.js Conversion

## Overview

This document outlines the design for converting the grocery shopping list application from SvelteKit to Alpine.js. The conversion transforms a component-based reactive framework into an HTML-first, declarative framework while preserving all functionality, visual design, and user experience.

The application will become a single HTML page with embedded Alpine.js directives, maintaining direct client-side communication with PocketBase for data persistence and Google OAuth authentication.

## Steering Document Alignment

### Technical Standards
- **Alpine.js**: Install via npm, bundle with Vite
- **TypeScript**: Maintain type safety with existing tsconfig patterns
- **PocketBase SDK**: Continue using the PocketBase JavaScript SDK
- **Tailwind CSS**: Keep existing Tailwind configuration and build process
- **Vite**: Minimal configuration for TypeScript compilation and bundling

### Project Structure
- Transition from SvelteKit's file-based routing to a static HTML structure
- Maintain separation of concerns: HTML templates, JavaScript services, CSS
- Keep PocketBase service layer isolated and reusable

## Code Reuse Analysis

### Existing Code to Preserve
- **PocketBase Service Functions**: `listItems`, `createItem`, `updateItem`, `deleteItem`, `boughtItem`, `needItem` - core logic remains identical
- **Tailwind CSS Classes**: All styling preserved exactly as-is
- **SVG Icons**: Embedded icons (checkmark, pencil, trash, clear) copied directly
- **OAuth Flow Logic**: Provider lookup, state management, code exchange

### Components Requiring Conversion
| Svelte Component | Alpine.js Equivalent |
|------------------|---------------------|
| `+page.svelte` | `index.html` with `x-data` root store |
| `Item.svelte` | `<template x-for>` with item-scoped data |
| `+layout.svelte` | Static HTML wrapper |
| `authState.ts` store | Direct localStorage access |
| `$:` reactive statements | `x-effect` or explicit method calls |
| `bind:value` | `x-model` |
| `on:click` | `@click` |
| `{#await}` blocks | Async methods with state flags |
| `{#each}` blocks | `x-for` directive |
| `{#if}` blocks | `x-show` or `x-if` |

### Integration Points
- **PocketBase API**: `https://db.guymon.family` - unchanged
- **Collections**: `groceries_items`, `groceries_purchases` - unchanged
- **Google OAuth**: Same provider configuration and redirect flow

## Architecture

### Application Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      index.html                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                 Alpine.js Root Store                     ││
│  │  x-data="groceryApp()"                                  ││
│  │  ┌────────────────┬────────────────┬──────────────────┐ ││
│  │  │   State        │   Methods      │   Computed       │ ││
│  │  │  - items       │  - loadItems() │  - filteredItems │ ││
│  │  │  - purchased   │  - addItem()   │                  │ ││
│  │  │  - filterTag   │  - updateItem()│                  │ ││
│  │  │  - search      │  - deleteItem()│                  │ ││
│  │  │  - loading     │  - toggleBought│                  │ ││
│  │  │  - error       │  - setFilter() │                  │ ││
│  │  └────────────────┴────────────────┴──────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                 Item Template (x-for)                    ││
│  │  - View mode: display name, tags, notes, buttons        ││
│  │  - Edit mode: input fields, update button               ││
│  │  - Per-item state via nested x-data                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐   ┌─────────────────┐
│  pocketbase.js  │   │    auth.html    │
│  Service Layer  │   │  OAuth Flow     │
└─────────────────┘   └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  PocketBase (https://db.guymon.family)  │
│  - groceries_items collection           │
│  - groceries_purchases collection       │
│  - users collection (OAuth)             │
└─────────────────────────────────────────┘
```

### Modular Design Principles

- **Single HTML Entry Point**: `index.html` contains all main UI with Alpine.js directives
- **Service Layer Isolation**: `pocketbase.ts` exports typed functions for data operations
- **Auth Separation**: `auth.html` and `auth-redirect.html` handle OAuth flow independently
- **Minimal Build Step**: Vite compiles TypeScript and bundles Alpine.js + PocketBase SDK

## Components and Interfaces

### Component 1: Grocery App Root Store

- **Purpose**: Main application state and business logic
- **Location**: `src/app.ts` defining `groceryApp()` function, registered via `Alpine.data()`
- **Interfaces**:
  ```typescript
  interface GroceryAppState {
    // State
    items: ItemType[];
    purchased: boolean;
    filterTag: string | null;
    search: string;
    loading: boolean;
    error: string | null;
    newItem: NewItemForm;

    // Lifecycle
    init(): Promise<void>;

    // Methods
    loadItems(): Promise<void>;
    addItem(): Promise<void>;
    toggleBought(item: ItemType): Promise<void>;
    saveItem(item: ItemType): Promise<void>;
    removeItem(item: ItemType): Promise<void>;
    setFilter(tag: string): void;
    clearFilter(): void;
    clearSearch(): void;
  }

  function groceryApp(): GroceryAppState {
    return {
      items: [],
      purchased: false,
      filterTag: null,
      search: '',
      loading: true,
      error: null,
      newItem: { name: '', tags: '', notes: '' },
      // ... method implementations
    }
  }
  ```
- **Dependencies**: PocketBase SDK, pocketbase.ts service

### Component 2: Item Row (Template)

- **Purpose**: Display and edit individual grocery items
- **Location**: `<template x-for>` within index.html
- **Interfaces**:
  ```typescript
  // Nested x-data for per-item state
  interface ItemRowState {
    editing: boolean;
  }
  // Template: x-data="{ editing: false }"
  ```
- **Methods**: Delegates to parent store via `$parent` or direct method calls
- **Dependencies**: Parent store methods

### Component 3: PocketBase Service Module

- **Purpose**: Encapsulate all database operations
- **Location**: `src/pocketbase.ts` (TypeScript module)
- **Interfaces**:
  ```typescript
  import PocketBase from 'pocketbase';

  // Initialization
  export const pb: PocketBase = new PocketBase('https://db.guymon.family');

  // Items
  export async function listItems(
    purchased: boolean,
    tag: string | null,
    search: string | null
  ): Promise<ItemType[]>;

  export async function createItem(item: NewItemForm): Promise<ItemType>;
  export async function updateItem(item: ItemType): Promise<void>;
  export async function deleteItem(id: string): Promise<void>;

  // Purchase actions
  export async function boughtItem(item: ItemType): Promise<void>;
  export async function needItem(id: string): Promise<void>;

  // Auth
  export async function checkAuth(): Promise<boolean>;
  export async function getAuthProviders(): Promise<AuthProviderInfo[]>;
  export async function authWithOAuth2Code(
    provider: string,
    code: string,
    codeVerifier: string,
    redirectUrl: string
  ): Promise<void>;
  ```
- **Dependencies**: PocketBase SDK

### Component 4: Auth Module

- **Purpose**: Handle Google OAuth flow
- **Location**: `src/auth.ts` with `auth.html` and `auth-redirect.html` templates
- **Flow**:
  1. `auth.html`: Fetch providers, store state in localStorage, redirect to Google
  2. `auth-redirect.html`: Exchange code for token, redirect to index
- **Dependencies**: pocketbase.ts, localStorage

## Data Models

### ItemType
```typescript
// src/types.ts
export interface ItemType {
  id: string;             // PocketBase UUID
  name: string;           // Item display name
  tags: string;           // Space-separated lowercase tags
  purchased: boolean;     // Current purchase status
  purchases: string[];    // Array of purchase record IDs
  notes?: string;         // Optional notes (cleared on purchase)
  count?: number;         // Computed: purchases in last 30 days (for sorting)
}
```

### NewItemForm
```typescript
export interface NewItemForm {
  name: string;     // Required
  tags: string;     // Optional, space-separated
  notes: string;    // Optional
}
```

### AuthProviderInfo
```typescript
export interface AuthProviderInfo {
  name: string;          // Provider name ("google")
  state: string;         // CSRF token
  codeVerifier: string;  // PKCE verifier
  authUrl: string;       // OAuth authorization URL
}
```

## State Management Strategy

### Svelte to Alpine.js Mapping

| Svelte Pattern | Alpine.js Equivalent |
|----------------|---------------------|
| `let items = []` | `items: []` in x-data object |
| `$: items = listItems(...)` | `x-effect` + explicit loadItems() call |
| `bind:value={search}` | `x-model="search"` |
| `on:click={handler}` | `@click="handler()"` |
| `{#if condition}` | `x-show="condition"` or `x-if="condition"` |
| `{#each items as item}` | `<template x-for="item in items">` |
| `{#await promise}` | `loading` state flag + async methods |

### Reactivity Approach

Alpine.js reactivity is triggered by:
1. **x-model**: Automatically syncs input values
2. **Method calls**: Explicitly updating state triggers re-render
3. **x-effect**: Watch expressions and react to changes

For the filter/search reactivity (previously `$: items = listItems(...)`):
```javascript
// Option 1: x-effect
x-effect="loadItems()"

// Option 2: Explicit calls on change
@change="loadItems()"
@click="purchased = !purchased; loadItems()"
```

**Chosen approach**: Explicit method calls on user actions for clarity and control.

## Error Handling

### Error Scenarios

1. **Authentication Failure**
   - **Handling**: Redirect to auth.html
   - **User Impact**: Sees login page, can retry OAuth
   - **Implementation**: Check `pb.authStore.isValid` on init

2. **Item List Load Failure**
   - **Handling**: Set `error` state, display message
   - **User Impact**: Sees "Failed to load items" with retry option
   - **Implementation**: try/catch in `loadItems()`, set `this.error`

3. **Item Creation Failure**
   - **Handling**: Set `error` state, preserve form input
   - **User Impact**: Sees error message, can retry
   - **Implementation**: try/catch in `addItem()`, don't clear form on error

4. **Item Update/Delete Failure**
   - **Handling**: Set error, revert optimistic update if any
   - **User Impact**: Sees error message, item state unchanged
   - **Implementation**: try/catch in save/delete methods

5. **OAuth Callback Error**
   - **Handling**: Display error on auth-redirect page
   - **User Impact**: Sees error message with link to retry
   - **Implementation**: try/catch around token exchange

### Error Display Pattern
```html
<div x-show="error" x-cloak class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
  <span x-text="error"></span>
  <button @click="error = null">&times;</button>
</div>
```

## Testing Strategy

### Unit Testing

**Approach**: Test PocketBase service functions in isolation
- Mock PocketBase SDK responses
- Test each function with various inputs
- Verify correct API calls and data transformations
- Full TypeScript type checking in tests

**Tools**: Vitest (existing) with TypeScript support

**Key Tests**:
- `listItems()` filtering and sorting logic
- `createItem()` tag lowercasing
- `boughtItem()` creates purchase record and clears notes
- Auth flow state management

### Integration Testing

**Approach**: Test Alpine.js components via DOM testing
- Render HTML with Alpine.js
- Trigger events and verify DOM updates
- Mock fetch/PocketBase for predictable results

**Tools**: Vitest + Testing Library DOM utilities

**Key Tests**:
- Tab switching updates item list
- Search input filters items
- Add item form creates item and clears
- Edit mode toggle shows/hides inputs

### End-to-End Testing

**Approach**: Full browser testing with real or mocked backend
- Test complete user flows
- Verify OAuth redirect handling
- Test offline/error scenarios

**Tools**: Playwright or Cypress (optional, future enhancement)

**Key Flows**:
- Login → View items → Add item → Mark as bought
- Search → Filter by tag → Clear filters
- Edit item → Save → Verify persistence

## Build Configuration

### Vite Setup

Minimal Vite configuration for TypeScript + Alpine.js:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'src/main.ts',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
```

### TypeScript Configuration

Extend existing tsconfig with adjustments for Alpine.js:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

### Package Dependencies

```json
{
  "dependencies": {
    "alpinejs": "^3.x",
    "pocketbase": "^0.21.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "typescript": "^5.x",
    "vitest": "^2.x",
    "@types/alpinejs": "^3.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

### Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

## File Structure

```
/
├── index.html                 # Main application page
├── auth.html                  # OAuth initiation page
├── auth-redirect.html         # OAuth callback page
├── src/
│   ├── types.ts               # TypeScript interfaces
│   ├── pocketbase.ts          # PocketBase service module
│   ├── app.ts                 # Alpine.js app component
│   ├── auth.ts                # Auth flow logic
│   └── main.ts                # Entry point (Alpine init)
├── dist/                      # Built output (gitignored)
│   └── main.js                # Bundled JS for production
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies
├── manifest.json              # PWA manifest (existing)
├── favicon.svg                # App icon (existing)
└── tests/
    ├── pocketbase.test.ts     # Service layer tests
    └── app.test.ts            # Integration tests
```

## Migration Checklist

- [ ] Set up Vite with TypeScript configuration
- [ ] Create `src/types.ts` with TypeScript interfaces
- [ ] Create `src/pocketbase.ts` with typed service functions
- [ ] Create `src/app.ts` with Alpine.js grocery app component
- [ ] Create `src/auth.ts` with OAuth flow logic
- [ ] Create `src/main.ts` entry point to initialize Alpine
- [ ] Create `index.html` with Alpine.js directives
- [ ] Implement item list display with x-for
- [ ] Implement tab switching (Need/Bought)
- [ ] Implement search and tag filtering
- [ ] Implement add item form
- [ ] Implement item edit mode
- [ ] Implement item delete with confirmation
- [ ] Implement purchase status toggle
- [ ] Create `auth.html` OAuth initiation page
- [ ] Create `auth-redirect.html` callback handler page
- [ ] Verify all Tailwind styling matches original
- [ ] Update PWA manifest if needed
- [ ] Write/adapt tests for new structure
- [ ] Remove SvelteKit dependencies and files
