import { pb } from './pocketbase';
import type { AuthProviderInfo } from './types';

const AUTH_STATE_KEY = 'authState';

/**
 * Check if user is authenticated, redirect to auth page if not
 */
export async function checkAuth(): Promise<boolean> {
	try {
		await pb.collection('users').authRefresh();
		return pb.authStore.isValid;
	} catch {
		return false;
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

	const redirectUrl = window.location.origin + '/auth-redirect.html';
	window.location.href = provider.authUrl + redirectUrl;
}

/**
 * Handle OAuth callback - exchange code for token
 */
export async function handleCallback(): Promise<void> {
	const params = new URL(window.location.href).searchParams;
	const provider = getAuthState();

	if (!provider) {
		throw new Error('No auth state found');
	}

	if (provider.state !== params.get('state')) {
		throw new Error("State parameters don't match");
	}

	const code = params.get('code');
	if (!code) {
		throw new Error('No authorization code received');
	}

	const redirectUrl = window.location.origin + '/auth-redirect.html';

	await pb.collection('users').authWithOAuth2Code(
		provider.name,
		code,
		provider.codeVerifier,
		redirectUrl,
		{ emailVisibility: false }
	);

	// Redirect to main app on success
	window.location.href = '/';
}
