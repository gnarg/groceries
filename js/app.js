// Main application entry point - modular approach
import { GroceryAPI } from './modules/pocketbase.js';
import { createGroceryApp, createItemComponent } from './modules/components.js';

// Initialize API
const api = new GroceryAPI('https://db.guymon.family');

// Alpine.js component factories with dependency injection
function groceryApp() {
  return createGroceryApp(api);
}

function itemComponent(item) {
  return createItemComponent(item, api);
}

// Only expose what Alpine.js needs globally
window.groceryApp = groceryApp;
window.itemComponent = itemComponent;

// Optionally expose API for debugging in development
if (window.location.hostname === 'localhost') {
  window.groceryAPI = api;
}