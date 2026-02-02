import { initOAuth } from './auth';

document.addEventListener('DOMContentLoaded', async () => {
	try {
		await initOAuth();
	} catch (e: unknown) {
		const error = e instanceof Error ? e.message : 'Failed to initialize login';
		document.body.innerHTML = `
			<div style="padding: 2rem; text-align: center;">
				<p style="color: red;">${error}</p>
				<a href="/" style="color: blue;">Return to home</a>
			</div>
		`;
	}
});
