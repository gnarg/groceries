# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run test` - Run tests with Vitest
- `npm run lint` - Run Prettier and ESLint
- `npm run format` - Format code with Prettier

## Architecture Overview

This is an Alpine.js-based grocery shopping list application with the following key components:

### Backend Integration
- **PocketBase**: Remote database at `https://db.guymon.family`
- Collections: `groceries_items` and `groceries_purchases`
- Authentication via Google OAuth provider

### Core Data Model
- **Items**: Have name, tags, purchased status, purchase history, and optional notes
- **Purchases**: Track when items were bought (linked to items)
- Items show recent purchase frequency (last 30 days) for sorting

### Application Structure
- **Main Page** (`index.html`): Item list with search, filtering, and add functionality using Alpine.js directives
- **App Component** (`src/app.ts`): Alpine.js component with state and methods
- **Auth Pages** (`auth.html`, `auth-redirect.html`): Google OAuth flow
- **PocketBase Layer** (`src/pocketbase.ts`): All database operations and business logic
- **Types** (`src/types.ts`): TypeScript interfaces for data models

### Key Features
- Switch between "Need" and "Bought" views
- Tag-based filtering and search
- Notes field for needed items (cleared when purchased)
- Purchase frequency tracking for intelligent sorting
- Mobile-optimized PWA with proper meta tags

### Technology Stack
- **Alpine.js**: Lightweight reactive framework
- **TypeScript**: Type safety throughout
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling with Inter font
- **Vitest**: Testing with jsdom and Testing Library
- **PocketBase**: Backend-as-a-Service for data and auth
- **Nix**: Development environment management

### File Structure
```
/
├── index.html              # Main application page
├── auth.html               # OAuth initiation page
├── auth-redirect.html      # OAuth callback page
├── src/
│   ├── main.ts             # Alpine.js entry point
│   ├── app.ts              # Grocery app component
│   ├── pocketbase.ts       # PocketBase service layer
│   ├── auth.ts             # Authentication functions
│   ├── types.ts            # TypeScript interfaces
│   └── app.css             # Tailwind CSS imports
├── static/                 # Static assets (favicon, icons, manifest)
├── tests/                  # Test files
└── dist/                   # Production build output
```

### Development Environment
The project uses Nix flakes for reproducible development environments with Node.js 24 and Claude Code included.
