# Tasks Document: Svelte to Alpine.js Conversion

## Phase 1: Project Setup

- [x] 1. Update package.json and install dependencies
  - File: package.json
  - Remove SvelteKit dependencies (@sveltejs/kit, svelte, svelte-check, etc.)
  - Add Alpine.js and @types/alpinejs
  - Keep: vite, typescript, vitest, tailwindcss, pocketbase, postcss, autoprefixer
  - Update scripts for new build process
  - Purpose: Establish the new dependency tree for Alpine.js + TypeScript
  - _Leverage: Existing package.json structure_
  - _Requirements: 8.1, 8.2_
  - _Prompt: Role: DevOps Engineer specializing in Node.js project configuration | Task: Update package.json to remove all SvelteKit/Svelte dependencies and add Alpine.js with TypeScript support, keeping Vite, Vitest, Tailwind, and PocketBase | Restrictions: Do not remove testing or styling dependencies, preserve existing scripts where applicable, ensure all versions are compatible | Success: npm install runs without errors, no Svelte dependencies remain, Alpine.js and types are installed_

- [x] 2. Create Vite configuration for Alpine.js
  - File: vite.config.ts
  - Configure build to output dist/main.js
  - Set up multi-page entry points (main, auth, auth-redirect)
  - Configure dev server for HTML files
  - Purpose: Enable TypeScript compilation and bundling without SvelteKit
  - _Leverage: Existing vite.config.ts patterns_
  - _Requirements: 8.2, 8.6_
  - _Prompt: Role: Build Engineer with Vite expertise | Task: Create vite.config.ts for Alpine.js with TypeScript, configuring multi-page build for index.html, auth.html, and auth-redirect.html with separate entry points | Restrictions: Keep configuration minimal, do not add unnecessary plugins, ensure dev server works with HTML files | Success: vite dev serves HTML files correctly, vite build produces bundled JS, TypeScript compiles without errors_

- [x] 3. Update TypeScript configuration
  - File: tsconfig.json
  - Remove Svelte-specific settings
  - Configure for browser ES modules
  - Add Alpine.js type references
  - Purpose: Enable TypeScript for vanilla Alpine.js development
  - _Leverage: Existing tsconfig.json_
  - _Requirements: 8.2_
  - _Prompt: Role: TypeScript Developer | Task: Update tsconfig.json to remove Svelte plugin references and configure for browser-based Alpine.js development with ES2020 target | Restrictions: Keep strict mode enabled, maintain path aliases if present, ensure DOM types are included | Success: TypeScript compiles all .ts files without errors, Alpine.js types are recognized_

- [x] 4. Update Tailwind configuration
  - File: tailwind.config.js, postcss.config.js
  - Update content paths for HTML files instead of Svelte files
  - Ensure Inter font plugin works
  - Purpose: Maintain existing styling with new file structure
  - _Leverage: Existing tailwind.config.js_
  - _Requirements: 8.4_
  - _Prompt: Role: Frontend Developer with Tailwind CSS expertise | Task: Update Tailwind content paths to scan HTML files and src/*.ts instead of Svelte files, keeping Inter font plugin and all existing configuration | Restrictions: Do not change theme or plugins, only update content paths | Success: Tailwind classes are included in build output, no missing styles_

## Phase 2: Core Infrastructure

- [x] 5. Create TypeScript interfaces
  - File: src/types.ts
  - Define ItemType, NewItemForm, AuthProviderInfo interfaces
  - Export all types for use across modules
  - Purpose: Establish type safety foundation
  - _Leverage: src/lib/pocketbase.ts existing type definitions_
  - _Requirements: 1, 2, 3, 4, 5, 6, 7_
  - _Prompt: Role: TypeScript Developer specializing in type systems | Task: Create src/types.ts with ItemType, NewItemForm, and AuthProviderInfo interfaces based on existing type patterns in src/lib/pocketbase.ts | Restrictions: Match existing type structure exactly, use optional properties where appropriate, export all types | Success: All interfaces compile, types match existing data structures_

- [x] 6. Create PocketBase service module
  - File: src/pocketbase.ts
  - Port all functions from src/lib/pocketbase.ts
  - Add proper TypeScript types to all functions
  - Export pb instance and all service functions
  - Purpose: Preserve all database operations with full type safety
  - _Leverage: src/lib/pocketbase.ts (copy and enhance)_
  - _Requirements: 1, 3, 4, 5, 6_
  - _Prompt: Role: Backend Developer with PocketBase expertise | Task: Port src/lib/pocketbase.ts to src/pocketbase.ts, adding full TypeScript types to all function parameters and return values, importing types from src/types.ts | Restrictions: Do not change function logic, preserve all business rules (tag lowercasing, notes clearing on purchase, 30-day purchase count), maintain identical API | Success: All functions work identically to original, full type coverage, no any types_

- [x] 7. Create auth module
  - File: src/auth.ts
  - Implement checkAuth() function for route protection
  - Implement initOAuth() for auth page
  - Implement handleCallback() for redirect page
  - Port localStorage auth state management
  - Purpose: Handle Google OAuth flow with type safety
  - _Leverage: src/lib/authState.ts, src/routes/auth/+page.svelte, src/routes/auth/redirect/+page.svelte_
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - _Prompt: Role: Security Engineer with OAuth expertise | Task: Create src/auth.ts with functions for auth checking, OAuth initiation, and callback handling, porting logic from Svelte auth components and authState store | Restrictions: Maintain CSRF protection via state parameter, preserve PKCE flow, use localStorage for state persistence | Success: OAuth flow works identically to original, auth state persists correctly_

## Phase 3: Alpine.js Application

- [x] 8. Create main Alpine.js entry point
  - File: src/main.ts
  - Import Alpine and register groceryApp component
  - Initialize Alpine.js
  - Purpose: Bootstrap Alpine.js application
  - _Leverage: Alpine.js documentation_
  - _Requirements: 8.2, 8.3_
  - _Prompt: Role: Frontend Developer with Alpine.js expertise | Task: Create src/main.ts that imports Alpine, registers the groceryApp component using Alpine.data(), and calls Alpine.start() | Restrictions: Keep initialization minimal, do not add global state or plugins | Success: Alpine.js initializes correctly, groceryApp is available in HTML_

- [x] 9. Create grocery app Alpine component
  - File: src/app.ts
  - Implement groceryApp() function returning Alpine data object
  - Add all state: items, purchased, filterTag, search, loading, error, newItem
  - Add init() lifecycle method with auth check and initial load
  - Add all methods: loadItems, addItem, toggleBought, saveItem, removeItem, setFilter, clearFilter, clearSearch
  - Purpose: Main application logic and state management
  - _Leverage: src/routes/+page.svelte (state and methods)_
  - _Requirements: 1, 2, 3, 4, 5, 6_
  - _Prompt: Role: Frontend Developer with Alpine.js and TypeScript expertise | Task: Create src/app.ts with groceryApp() function implementing all state and methods from +page.svelte, using async/await for PocketBase calls, with full TypeScript types | Restrictions: Use explicit method calls instead of Svelte reactive statements, handle loading states properly, maintain identical functionality | Success: All features work: tab switching, search, filter, add, edit, delete, purchase toggle_

- [x] 10. Create auth page entry point
  - File: src/auth-init.ts
  - Import auth module
  - Call initOAuth() on page load
  - Purpose: Initialize OAuth flow on auth page
  - _Leverage: src/auth.ts_
  - _Requirements: 7.1, 7.2_
  - _Prompt: Role: Frontend Developer | Task: Create src/auth-init.ts that imports initOAuth from auth.ts and calls it on DOMContentLoaded | Restrictions: Keep minimal, single responsibility | Success: Auth page redirects to Google OAuth correctly_

- [x] 11. Create auth redirect page entry point
  - File: src/auth-redirect.ts
  - Import auth module
  - Call handleCallback() on page load
  - Handle errors with user-visible message
  - Purpose: Complete OAuth flow on callback
  - _Leverage: src/auth.ts_
  - _Requirements: 7.3, 7.4, 7.5_
  - _Prompt: Role: Frontend Developer | Task: Create src/auth-redirect.ts that imports handleCallback from auth.ts, calls it on DOMContentLoaded, and displays errors if authentication fails | Restrictions: Redirect to index on success, show error on failure | Success: OAuth callback completes and redirects to main app_

## Phase 4: HTML Templates

- [x] 12. Create main index.html
  - File: index.html
  - Add doctype, head with meta tags, Tailwind CSS
  - Create main layout structure matching +layout.svelte
  - Add x-data="groceryApp()" to root element
  - Implement header with icon and title
  - Implement search bar with x-model and clear button
  - Implement Need/Bought tabs with @click handlers
  - Implement error display with x-show
  - Implement loading state with x-show
  - Implement items list with x-for
  - Implement add item form with x-model bindings
  - Include script tag for dist/main.js
  - Purpose: Main application UI with Alpine.js directives
  - _Leverage: src/routes/+page.svelte, src/routes/+layout.svelte, src/app.html_
  - _Requirements: 1, 2, 3_
  - _Prompt: Role: Frontend Developer with Alpine.js and Tailwind CSS expertise | Task: Create index.html with full UI matching existing Svelte templates, using Alpine.js directives (x-data, x-model, x-show, x-for, @click) and preserving all Tailwind classes exactly | Restrictions: Match visual appearance exactly, preserve all SVG icons, maintain accessibility attributes | Success: UI looks identical to Svelte version, all interactions work_

- [x] 13. Create item template within index.html
  - File: index.html (item row section)
  - Add template x-for with item iteration
  - Implement view mode: name, tags, notes, toggle button, edit button, delete button
  - Implement edit mode with x-show: input fields for name, tags, notes
  - Add nested x-data for per-item editing state
  - Wire up @click handlers to parent methods
  - Purpose: Individual item display and editing
  - _Leverage: src/routes/Item.svelte_
  - _Requirements: 4, 5, 6_
  - _Prompt: Role: Frontend Developer with Alpine.js expertise | Task: Implement item row template within index.html using x-for, with view/edit mode toggle using nested x-data, preserving all Tailwind styling and SVG icons from Item.svelte | Restrictions: Match visual appearance exactly, handle tag click for filtering, confirm before delete | Success: Items display correctly, edit mode works, all buttons function_

- [x] 14. Create auth.html
  - File: auth.html
  - Add minimal HTML structure
  - Display loading message during redirect
  - Include script tag for dist/auth-init.js
  - Purpose: OAuth initiation page
  - _Leverage: src/routes/auth/+page.svelte_
  - _Requirements: 7.1, 7.2_
  - _Prompt: Role: Frontend Developer | Task: Create auth.html with minimal structure showing "Redirecting to login..." message, including auth-init.js script | Restrictions: Keep minimal, auto-redirect behavior | Success: Page loads and redirects to Google OAuth_

- [x] 15. Create auth-redirect.html
  - File: auth-redirect.html
  - Add HTML structure for callback handling
  - Display loading message during token exchange
  - Add error display area
  - Include script tag for dist/auth-redirect.js
  - Purpose: OAuth callback handler page
  - _Leverage: src/routes/auth/redirect/+page.svelte_
  - _Requirements: 7.3, 7.4, 7.5_
  - _Prompt: Role: Frontend Developer | Task: Create auth-redirect.html with loading message and error display area, including auth-redirect.js script | Restrictions: Handle both success and failure cases | Success: Successful auth redirects to index, failures display error message_

## Phase 5: Testing

- [x] 16. Update test configuration
  - File: vitest.config.ts (or vite.config.ts test section)
  - Configure for TypeScript tests
  - Set up jsdom environment
  - Remove Svelte testing dependencies
  - Purpose: Enable testing for new structure
  - _Leverage: Existing vitest configuration_
  - _Requirements: Testing NFR_
  - _Prompt: Role: QA Engineer with Vitest expertise | Task: Update Vitest configuration to work with TypeScript and jsdom without Svelte, configuring test environment for Alpine.js components | Restrictions: Keep existing test patterns where possible | Success: vitest runs without Svelte dependencies_

- [x] 17. Port PocketBase service tests
  - File: tests/pocketbase.test.ts
  - Port existing tests from src/routes/Item.test.ts patterns
  - Test listItems, createItem, updateItem, deleteItem
  - Test boughtItem, needItem
  - Mock PocketBase SDK
  - Purpose: Verify service layer correctness
  - _Leverage: src/routes/Item.test.ts mocking patterns_
  - _Requirements: 1, 3, 4, 5, 6_
  - _Prompt: Role: QA Engineer with TypeScript testing expertise | Task: Create tests/pocketbase.test.ts testing all service functions with mocked PocketBase SDK, covering success and error cases | Restrictions: Mock all external calls, test business logic only | Success: All service functions tested, tests pass_

- [x] 18. Create Alpine.js component tests
  - File: tests/app.test.ts
  - Test groceryApp initialization
  - Test state changes (tab switching, filtering)
  - Test method behavior with mocked services
  - Purpose: Verify component logic
  - _Leverage: Testing Library DOM utilities_
  - _Requirements: 1, 2, 3, 4, 5, 6_
  - _Prompt: Role: QA Engineer with Alpine.js testing expertise | Task: Create tests/app.test.ts testing groceryApp component initialization and methods, mocking pocketbase.ts functions | Restrictions: Test logic not DOM rendering, use Testing Library where helpful | Success: Component methods tested, state transitions verified_

## Phase 6: Cleanup

- [x] 19. Remove Svelte files
  - Files: src/routes/**, src/lib/**, src/app.html, src/app.css (if moved), svelte.config.js
  - Delete all Svelte components and configuration
  - Keep static assets (favicon, manifest)
  - Purpose: Complete migration from Svelte
  - _Requirements: 8.1_
  - _Prompt: Role: Developer | Task: Remove all Svelte-related files including src/routes/, src/lib/, svelte.config.js, and any .svelte files, keeping static assets and new src/*.ts files | Restrictions: Do not delete new Alpine.js files, preserve manifest.json and favicon | Success: No Svelte files remain, project builds successfully_

- [x] 20. Update static assets
  - Files: manifest.json, index.html meta tags
  - Verify PWA configuration
  - Update any paths if needed
  - Purpose: Maintain PWA functionality
  - _Leverage: Existing manifest.json_
  - _Requirements: Reliability NFR, Usability NFR_
  - _Prompt: Role: Frontend Developer | Task: Verify manifest.json and PWA meta tags in index.html are correct, updating start_url or other paths if the build output location changed | Restrictions: Do not change app name or icons | Success: PWA installs correctly, offline caching works if previously configured_

- [x] 21. Final verification and documentation
  - Files: README.md (if exists), CLAUDE.md
  - Run full test suite
  - Verify all functionality manually
  - Update development commands in CLAUDE.md
  - Purpose: Ensure successful migration
  - _Requirements: All_
  - _Prompt: Role: Senior Developer | Task: Run npm test and npm run build, manually verify all features work (login, view items, add, edit, delete, purchase toggle, search, filter), update CLAUDE.md with new commands if changed | Restrictions: Do not add new features, only verify existing functionality | Success: All tests pass, all features work, documentation is accurate_

## Task Dependencies

```
Phase 1 (Setup): 1 → 2 → 3 → 4
Phase 2 (Core): 5 → 6 → 7
Phase 3 (App): 8 → 9, 10, 11 (parallel after 8)
Phase 4 (HTML): 12 → 13, 14, 15 (parallel after 12)
Phase 5 (Test): 16 → 17 → 18
Phase 6 (Cleanup): 19 → 20 → 21

Cross-phase dependencies:
- Phase 2 depends on Phase 1 completion
- Phase 3 depends on Phase 2 completion
- Phase 4 depends on Phase 3 completion
- Phase 5 can start after Phase 2 (service tests)
- Phase 6 depends on Phase 4 and Phase 5 completion
```
