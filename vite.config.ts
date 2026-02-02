import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	publicDir: 'static',
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				auth: resolve(__dirname, 'auth.html'),
				'auth/redirect': resolve(__dirname, 'auth/redirect.html')
			}
		}
	},
	test: {
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./tests/vitest-setup.ts']
	}
});
