# Requirements Document: Svelte to Alpine.js Conversion

## Introduction

This specification covers the conversion of the grocery shopping list application from SvelteKit to Alpine.js. The goal is to replace the Svelte framework with Alpine.js while maintaining identical functionality and user experience. The application will remain a static, client-side application that communicates directly with PocketBase for data persistence and authentication.

## Alignment with Product Vision

This conversion supports the following goals:
- **Simplicity**: Alpine.js is a minimal framework (~17KB) with a gentle learning curve
- **No Build Step Required**: Alpine.js can work without a build process, reducing complexity
- **Maintainability**: HTML-first approach makes the codebase accessible to developers unfamiliar with Svelte
- **Performance**: Smaller bundle size and simpler runtime compared to SvelteKit

## Requirements

### Requirement 1: Item List Display

**User Story:** As a user, I want to view my grocery items organized by purchase status, so that I can see what I need to buy and what I've already bought.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display items marked as "Need" by default
2. WHEN user clicks "Bought" tab THEN the system SHALL display only purchased items
3. WHEN user clicks "Need" tab THEN the system SHALL display only unpurchased items
4. WHEN items are displayed THEN the system SHALL sort them by purchase frequency (most frequently bought items first)
5. WHEN items are loading THEN the system SHALL display a loading indicator
6. IF an error occurs during loading THEN the system SHALL display an error message

### Requirement 2: Search and Filter

**User Story:** As a user, I want to search and filter my grocery items, so that I can quickly find specific items.

#### Acceptance Criteria

1. WHEN user types in the search field THEN the system SHALL filter items by name and tags in real-time
2. WHEN user clicks a tag on any item THEN the system SHALL filter to show only items with that tag
3. WHEN a tag filter is active THEN the system SHALL display the active filter with a clear button
4. WHEN user clicks the clear filter button THEN the system SHALL remove the tag filter and show all items
5. WHEN user clicks the clear search button THEN the system SHALL clear the search input

### Requirement 3: Add New Item

**User Story:** As a user, I want to add new grocery items, so that I can build my shopping list.

#### Acceptance Criteria

1. WHEN user fills in the item name and clicks "Add" THEN the system SHALL create a new item in PocketBase
2. WHEN item is created successfully THEN the system SHALL clear the form and refresh the item list
3. IF item creation fails THEN the system SHALL display an error message
4. WHEN adding an item THEN the system SHALL allow optional notes and tags fields
5. WHEN tags are provided THEN the system SHALL store them as lowercase, space-separated values

### Requirement 4: Edit Item

**User Story:** As a user, I want to edit existing grocery items, so that I can update their details.

#### Acceptance Criteria

1. WHEN user clicks the edit button on an item THEN the system SHALL display editable input fields
2. WHEN in edit mode THEN the system SHALL show fields for name, tags, and notes (notes only if not purchased)
3. WHEN user clicks update THEN the system SHALL save changes to PocketBase
4. WHEN update is successful THEN the system SHALL return to view mode with updated data
5. IF update fails THEN the system SHALL display an error message

### Requirement 5: Delete Item

**User Story:** As a user, I want to delete grocery items, so that I can remove items I no longer need.

#### Acceptance Criteria

1. WHEN user clicks the delete button THEN the system SHALL prompt for confirmation
2. WHEN user confirms deletion THEN the system SHALL remove the item from PocketBase
3. WHEN deletion is successful THEN the system SHALL remove the item from the displayed list
4. IF user cancels deletion THEN the system SHALL keep the item unchanged

### Requirement 6: Toggle Purchase Status

**User Story:** As a user, I want to mark items as bought or needed, so that I can track my shopping progress.

#### Acceptance Criteria

1. WHEN user clicks the purchase toggle on an unpurchased item THEN the system SHALL mark it as purchased
2. WHEN marking as purchased THEN the system SHALL create a purchase record with timestamp
3. WHEN marking as purchased THEN the system SHALL clear the notes field
4. WHEN user clicks the purchase toggle on a purchased item THEN the system SHALL mark it as unpurchased
5. WHEN purchase status changes THEN the system SHALL update the visual styling immediately

### Requirement 7: Authentication

**User Story:** As a user, I want to log in with my Google account, so that my grocery list is private and synced.

#### Acceptance Criteria

1. WHEN user is not authenticated THEN the system SHALL redirect to the auth page
2. WHEN on auth page THEN the system SHALL initiate OAuth flow with Google provider
3. WHEN OAuth callback is received THEN the system SHALL exchange code for access token
4. WHEN authentication succeeds THEN the system SHALL redirect to the main page
5. IF authentication fails THEN the system SHALL display an error message
6. WHEN application loads THEN the system SHALL validate existing auth token

### Requirement 8: Framework Conversion

**User Story:** As a developer, I want the codebase converted to Alpine.js, so that it no longer depends on Svelte.

#### Acceptance Criteria

1. WHEN conversion is complete THEN the system SHALL NOT include any Svelte dependencies
2. WHEN conversion is complete THEN the system SHALL use Alpine.js for all client-side reactivity
3. WHEN conversion is complete THEN the system SHALL maintain all existing functionality
4. WHEN conversion is complete THEN the system SHALL maintain identical visual appearance
5. WHEN conversion is complete THEN the system SHALL maintain direct PocketBase communication from client
6. WHEN conversion is complete THEN the system SHALL support static hosting (no server required)

## Non-Functional Requirements

### Code Architecture and Modularity

- **Single Responsibility Principle**: Separate HTML templates from JavaScript logic where practical
- **Modular Design**: PocketBase service layer should remain isolated and reusable
- **Dependency Management**: Alpine.js via CDN or single bundled file; PocketBase SDK included
- **Clear Interfaces**: Alpine.js components should have well-defined data models and methods

### Performance

- Bundle size should be smaller than or equal to current SvelteKit build
- Initial page load should complete within 2 seconds on 3G connection
- Item list should update within 100ms of user interaction
- No visible layout shift during page load

### Security

- Authentication tokens stored securely in localStorage (existing behavior)
- No sensitive data exposed in HTML source
- OAuth flow must validate state parameter to prevent CSRF
- All PocketBase communication over HTTPS

### Reliability

- Application should work offline for viewing cached items (PWA behavior preserved)
- Error states should be clearly communicated to users
- Failed operations should not corrupt local state

### Usability

- All existing keyboard navigation must work
- Mobile touch interactions must remain responsive
- Visual design must match current Tailwind-based styling exactly
- PWA features (home screen install, viewport meta) must be preserved

### Testing

- Existing test patterns should be adaptable to Alpine.js testing
- Core PocketBase service tests should remain functional
- Component behavior should be testable with similar coverage

## Out of Scope

- Backend server implementation (client-only architecture preserved)
- New features or functionality
- Visual design changes
- Database schema modifications
- Authentication provider changes
