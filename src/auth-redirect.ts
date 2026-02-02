import { handleCallback } from './auth';

document.addEventListener('DOMContentLoaded', async () => {
	const errorDiv = document.getElementById('error');
	const loadingDiv = document.getElementById('loading');

	try {
		await handleCallback();
		// Redirect happens in handleCallback on success
	} catch (e: unknown) {
		const error = e instanceof Error ? e.message : 'Failed to complete login';
		if (loadingDiv) loadingDiv.style.display = 'none';
		if (errorDiv) {
			errorDiv.textContent = error;
			errorDiv.style.display = 'block';
		}
	}
});
