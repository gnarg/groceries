# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run serve` - Start HTTP development server on localhost:3000 (required for OAuth)
- `npm run lint` - Run Prettier and ESLint
- `npm run format` - Format code with Prettier

Note: Traditional SvelteKit commands (`npm run dev`, `npm run build`, etc.) are no longer used as this project has been converted to vanilla Alpine.js.

## Architecture Overview

This is an Alpine.js grocery shopping list application that has been converted from SvelteKit to eliminate build processes entirely.

### Backend Integration
- **PocketBase**: Remote database at `https://db.guymon.family`
- Collections: `groceries_items` and `groceries_purchases`
- Authentication via Google OAuth 2.0 with PKCE flow

### Core Data Model
- **Items**: Have name, tags, purchased status, purchase history, and optional notes
- **Purchases**: Track when items were bought (linked to items) 
- Items show recent purchase frequency (last 30 days) for intelligent sorting

### Application Structure
- **Main App** (`index.html`): Contains Alpine.js grocery list component with search, filtering, and CRUD operations
- **Auth Flow** (`auth.html` → `auth-redirect.html`): Google OAuth integration with PocketBase
- **API Layer** (`js/modules/pocketbase.js`): GroceryAPI class with all database operations
- **Components** (`js/modules/components.js`): Alpine.js component factories with dependency injection
- **Entry Point** (`js/app.js`): Initializes API and exposes component factories to global scope

### Key Implementation Details
- **No Build Process**: Uses CDN for Alpine.js, Tailwind CSS, and PocketBase
- **Modular Architecture**: ES6 modules with dependency injection for better testing and maintainability
- **Minimal Global Exposure**: Only Alpine.js component factories exposed globally
- **Debounced Search**: 300ms delay prevents PocketBase auto-cancellation errors
- **HTTP Server Required**: Google OAuth requires HTTP protocol, not file://

### Authentication Flow
1. Unauthenticated users redirected to `auth.html`
2. `auth.html` fetches OAuth providers and redirects to Google
3. Google redirects to `auth-redirect.html` with authorization code
4. `auth-redirect.html` exchanges code for tokens via PocketBase
5. User redirected to main app (`index.html`)

### Technology Stack
- **Alpine.js**: Reactive frontend framework via CDN
- **Tailwind CSS**: Utility-first styling via CDN  
- **PocketBase**: Backend-as-a-Service for data and auth
- **Vanilla JavaScript**: No TypeScript or build tooling
- **Node.js HTTP Server**: Simple static file server for development