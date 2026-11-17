import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PocketBase before importing the module under test
vi.mock('pocketbase', () => {
	const mockCollection = vi.fn();
	return {
		default: vi.fn().mockImplementation(() => ({
			collection: mockCollection
		}))
	};
});

import { checkAuth, isAuthError, requireLogin } from '../src/auth';
import { pb } from '../src/pocketbase';

const unauthorized = Object.assign(new Error('Missing or invalid authentication.'), {
	status: 401
});

type UsersCollection = ReturnType<typeof pb.collection>;

/** Stub `pb.collection('users')` with a partial implementation. */
function mockUsers(impl: Partial<UsersCollection>): void {
	vi.mocked(pb.collection).mockReturnValue(impl as UsersCollection);
}

describe('auth', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.defineProperty(window, 'location', {
			value: { href: '' },
			writable: true
		});
		// Fresh in-memory auth store per test
		const store = {
			token: '',
			model: null as unknown,
			isValid: false,
			save(token: string, model?: unknown) {
				this.token = token;
				this.model = model ?? null;
				this.isValid = !!token;
			},
			clear() {
				this.token = '';
				this.model = null;
				this.isValid = false;
			}
		};
		Object.defineProperty(pb, 'authStore', {
			value: store,
			writable: true,
			configurable: true
		});
	});

	describe('checkAuth', () => {
		it('should return false without refreshing when there is no local token', async () => {
			const authRefresh = vi.fn();
			mockUsers({ authRefresh });

			await expect(checkAuth()).resolves.toBe(false);
			expect(pb.collection).not.toHaveBeenCalled();
			expect(authRefresh).not.toHaveBeenCalled();
		});

		it('should return true when the server accepts the token', async () => {
			pb.authStore.save('a-token');
			const authRefresh = vi.fn().mockResolvedValue({ token: 'a-token' });
			mockUsers({ authRefresh });

			await expect(checkAuth()).resolves.toBe(true);
			expect(pb.collection).toHaveBeenCalledWith('users');
			expect(authRefresh).toHaveBeenCalled();
			expect(pb.authStore.isValid).toBe(true);
		});

		it('should clear the stored token and return false on 401', async () => {
			pb.authStore.save('stale-token');
			const authRefresh = vi.fn().mockRejectedValue(unauthorized);
			mockUsers({ authRefresh });

			await expect(checkAuth()).resolves.toBe(false);
			expect(pb.authStore.token).toBe('');
			expect(pb.authStore.isValid).toBe(false);
		});

		it('should keep the token and return true on non-auth failures', async () => {
			pb.authStore.save('good-token');
			const authRefresh = vi
				.fn()
				.mockRejectedValue(Object.assign(new Error('boom'), { status: 503 }));
			mockUsers({ authRefresh });

			await expect(checkAuth()).resolves.toBe(true);
			expect(pb.authStore.token).toBe('good-token');
		});

		it('should keep the token and return true on network errors', async () => {
			pb.authStore.save('good-token');
			const authRefresh = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
			mockUsers({ authRefresh });

			await expect(checkAuth()).resolves.toBe(true);
			expect(pb.authStore.token).toBe('good-token');
		});
	});

	describe('isAuthError', () => {
		it('should match errors with status 401', () => {
			expect(isAuthError(unauthorized)).toBe(true);
		});

		it('should not match other statuses or non-errors', () => {
			expect(isAuthError(Object.assign(new Error('x'), { status: 403 }))).toBe(false);
			expect(isAuthError(new Error('x'))).toBe(false);
			expect(isAuthError(null)).toBe(false);
			expect(isAuthError('401')).toBe(false);
		});
	});

	describe('requireLogin', () => {
		it('should clear the session and redirect to the login page', () => {
			pb.authStore.save('a-token');

			requireLogin();

			expect(pb.authStore.token).toBe('');
			expect(window.location.href).toBe('/auth.html');
		});
	});
});
