import { pb } from './pocketbase';
import type { AuthProviderInfo } from './types';

const AUTH_STATE_KEY = 'authState';
const LOGIN_PATH = '/auth.html';

/**
 * True when an error means the server rejected our credentials (HTTP 401): the
 * stored token is missing, expired, or no longer signed by a key the server
 * accepts.
 *
 * Duck-typed instead of `instanceof ClientResponseError` so it also matches
 * stubbed errors in tests and any future SDK error shape.
 */
export function isAuthError(e: unknown): boolean {
	return typeof e === 'object' && e !== null && (e as { status?: unknown }).status === 401;
}

/**
 * Drop the local session and send the user to the login page.
 */
export function requireLogin(): void {
	pb.authStore.clear();
	window.location.href = LOGIN_PATH;
}

/**
 * Check that we hold a session the server still accepts.
 *
 * A purely local check (`authStore.isValid`) only decodes the stored token's
 * expiry, so it also passes for tokens the server has since rejected -- a rotated
 * JWT secret, a restored backup, or a deleted/recreated user record. That showed
 * up as a "Missing or invalid authentication." error box with no way back to
 * login, because nothing downstream cleared the dead token. The refresh round trip
 * confirms validity server-side (and extends the session while it's at it).
 */
export async function checkAuth(): Promise<boolean> {
	if (!pb.authStore.isValid) {
		return false;
	}

	try {
		await pb.collection('users').authRefresh();
		return pb.authStore.isValid;
	} catch (e: unknown) {
		// Only a 401 proves the token is dead. Anything else (network blip,
		// server hiccup) leaves the stored token alone so a transient outage
		// doesn't log the user out.
		if (isAuthError(e)) {
			pb.authStore.clear();
			return false;
		}
		return true;
	}
}

/**
 * Get auth state from localStorage
 */
function getAuthState(): AuthProviderInfo | null {
	const stored = localStorage.getItem(AUTH_STATE_KEY);
	if (!stored) return null;
	try {
		return JSON.parse(stored) as AuthProviderInfo;
	} catch {
		return null;
	}
}

/**
 * Save auth state to localStorage
 */
function setAuthState(provider: AuthProviderInfo): void {
	localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(provider));
}

/**
 * Initialize OAuth flow - fetches providers and redirects to Google
 */
export async function initOAuth(): Promise<void> {
	const authMethods = await pb.collection('users').listAuthMethods();
	const provider = authMethods.authProviders.find((p) => p.name === 'google');

	if (!provider) {
		throw new Error('Google auth provider not found');
	}

	setAuthState(provider);

	const redirectUrl = window.location.origin + '/auth/redirect';
	window.location.href = provider.authUrl + redirectUrl;
}

/**
 * Handle OAuth callback - exchange code for token
 */
export async function handleCallback(): Promise<void> {
	console.log('[Auth] handleCallback called');
	const params = new URL(window.location.href).searchParams;
	const provider = getAuthState();

	console.log('[Auth] Provider from localStorage:', provider ? provider.name : 'null');
	console.log('[Auth] State param:', params.get('state'));
	console.log('[Auth] Code param:', params.get('code') ? 'exists' : 'null');

	if (!provider) {
		throw new Error('No auth state found');
	}

	if (provider.state !== params.get('state')) {
		console.log('[Auth] State mismatch - provider.state:', provider.state);
		throw new Error("State parameters don't match");
	}

	const code = params.get('code');
	if (!code) {
		throw new Error('No authorization code received');
	}

	const redirectUrl = window.location.origin + '/auth/redirect';
	console.log('[Auth] Redirect URL:', redirectUrl);

	console.log('[Auth] Calling authWithOAuth2Code...');
	await pb
		.collection('users')
		.authWithOAuth2Code(provider.name, code, provider.codeVerifier, redirectUrl, {
			emailVisibility: false
		});

	console.log('[Auth] authWithOAuth2Code succeeded');
	console.log('[Auth] authStore.isValid:', pb.authStore.isValid);
	console.log('[Auth] authStore.token:', pb.authStore.token ? 'exists' : 'empty');

	// Verify localStorage was updated
	const storedAuth = localStorage.getItem('pocketbase_auth');
	console.log('[Auth] localStorage pocketbase_auth:', storedAuth ? 'exists' : 'empty');

	// Redirect to main app on success
	console.log('[Auth] Redirecting to /');
	window.location.href = '/';
}
