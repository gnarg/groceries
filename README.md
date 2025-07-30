# Groceries - Alpine.js Shopping List

A simple, fast grocery shopping list application built with Alpine.js and PocketBase. No build process required - just serve the static files.

## Features

- **Simple grocery management**: Add, edit, delete, and mark items as purchased
- **Tag-based organization**: Organize items with custom tags and filter by tag
- **Search functionality**: Search items by name or tags with real-time filtering
- **Notes support**: Add notes to items (automatically cleared when purchased)
- **Purchase tracking**: Switch between "Need" and "Bought" views
- **Google OAuth authentication**: Secure login via Google
- **Mobile-optimized**: Responsive design with PWA support

## Architecture

- **Frontend**: Pure HTML/CSS/JavaScript with Alpine.js for reactivity
- **Styling**: Tailwind CSS via CDN
- **Backend**: PocketBase hosted at `https://db.guymon.family`
- **Authentication**: Google OAuth 2.0 with PKCE flow
- **Data**: Two collections - `groceries_items` and `groceries_purchases`

## File Structure

```
/
├── index.html              # Main application page
├── auth.html              # OAuth authentication flow
├── auth-redirect.html     # OAuth callback handler
├── serve.js              # Development HTTP server
├── js/
│   ├── pocketbase.js     # PocketBase API wrapper
│   └── app.js            # Alpine.js components
└── static/
    └── icon.png          # App icon
```

## Development

### Prerequisites

- Node.js (for development server)
- Modern web browser

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run serve`
4. Open http://localhost:3000

### Development Server

The app requires an HTTP server (not file://) due to Google OAuth CORS policies. Use the included Node.js server:

```bash
npm run serve
```

This serves the application on http://localhost:3000.

## Authentication

The app uses Google OAuth 2.0 for authentication:

1. Users are redirected to `auth.html` if not authenticated
2. `auth.html` initiates OAuth flow with Google
3. Google redirects to `auth-redirect.html` with authorization code
4. `auth-redirect.html` exchanges code for tokens and redirects to main app

## Deployment

Deploy the static files to any web server. Ensure:

1. All files are served over HTTPS in production
2. Google OAuth redirect URIs are configured for your domain
3. PocketBase instance is accessible and configured

## API Integration

The app communicates with PocketBase through `js/pocketbase.js` which provides:

- `listItems(purchased, tag, search)` - Fetch filtered items
- `createItem(item)` - Create new grocery item
- `updateItem(item)` - Update existing item
- `deleteItem(id)` - Delete item
- `boughtItem(item)` - Mark item as purchased
- `needItem(id)` - Mark item as needed

## Configuration

- PocketBase URL: `https://db.guymon.family` (configured in `js/pocketbase.js`)
- Google OAuth: Configure redirect URIs in Google Console
- Search debouncing: 300ms delay to prevent API overload