# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run test` - Run tests with Vitest
- `npm run check` - Type check with svelte-check
- `npm run lint` - Run Prettier and ESLint
- `npm run format` - Format code with Prettier

## Architecture Overview

This is a SvelteKit-based grocery shopping list application with the following key components:

### Backend Integration
- **PocketBase**: Remote database at `https://db.guymon.family`
- Collections: `groceries_items` and `groceries_purchases`
- Authentication via Google OAuth provider

### Core Data Model
- **Items**: Have name, tags, purchased status, purchase history, and optional notes
- **Purchases**: Track when items were bought (linked to items)
- Items show recent purchase frequency (last 30 days) for sorting

### Application Structure
- **Main Page** (`src/routes/+page.svelte`): Item list with search, filtering, and add functionality
- **Item Component** (`src/routes/Item.svelte`): Individual item display with edit/delete/toggle purchased
- **Auth Flow** (`src/routes/auth/`): Google OAuth integration with PocketBase
- **PocketBase Layer** (`src/lib/pocketbase.ts`): All database operations and business logic

### Key Features
- Switch between "Need" and "Bought" views
- Tag-based filtering and search
- Notes field for needed items (cleared when purchased)
- Purchase frequency tracking for intelligent sorting
- Mobile-optimized PWA with proper meta tags

### Technology Stack
- **SvelteKit**: Main framework with static adapter
- **TypeScript**: Type safety throughout
- **Tailwind CSS**: Styling with Inter font
- **Vitest**: Testing with jsdom and Testing Library
- **PocketBase**: Backend-as-a-Service for data and auth
- **Nix**: Development environment management

### Development Environment
The project uses Nix flakes for reproducible development environments with Node.js 24 and Claude Code included.