import Alpine from 'alpinejs';
import { groceryApp } from './app';

// Register the grocery app component
Alpine.data('groceryApp', groceryApp);

// Start Alpine
Alpine.start();

// Make Alpine available globally for debugging
declare global {
	interface Window {
		Alpine: typeof Alpine;
	}
}
window.Alpine = Alpine;
