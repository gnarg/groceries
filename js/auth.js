import PocketBase from 'https://cdn.jsdelivr.net/npm/pocketbase@0.21.5/dist/pocketbase.es.mjs';

const pb = new PocketBase('https://db.guymon.family');

// Alpine.js store for auth state
Alpine.store('auth', {
    user: null,
    provider: null,

    init() {
        // Load auth state from localStorage
        const stored = localStorage.getItem('authState');
        if (stored) {
            try {
                this.provider = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse auth state:', e);
            }
        }
    },

    setProvider(provider) {
        this.provider = provider;
        localStorage.setItem('authState', JSON.stringify(provider));
    },

    clearAuth() {
        this.user = null;
        this.provider = null;
        localStorage.removeItem('authState');
    },

    async getAuthProviders() {
        try {
            const authMethods = await pb.collection('users').listAuthMethods();
            return authMethods.authProviders;
        } catch (error) {
            console.error('Error fetching auth providers:', error);
            return [];
        }
    },

    async authenticateWithOAuth2(providerName, code, codeVerifier, redirectUrl) {
        try {
            const result = await pb.collection('users').authWithOAuth2Code(
                providerName,
                code,
                codeVerifier,
                redirectUrl,
                { emailVisibility: false, nameVisibility: false }
            );
            this.user = result.record;
            return result;
        } catch (error) {
            console.error('OAuth2 authentication failed:', error);
            throw error;
        }
    }
});

// Export functions for global use
window.initAuth = () => {
    Alpine.store('auth').init();
};

export { pb };