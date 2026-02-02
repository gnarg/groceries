import type { ItemType, NewItemForm } from './types';
import {
	listItems,
	createItem,
	updateItem,
	deleteItem,
	boughtItem,
	needItem
} from './pocketbase';
import { checkAuth } from './auth';

export interface GroceryAppState {
	items: ItemType[];
	purchased: boolean;
	filterTag: string | null;
	search: string;
	loading: boolean;
	error: string | null;
	newItem: NewItemForm;

	init(): Promise<void>;
	loadItems(): Promise<void>;
	addItem(): Promise<void>;
	toggleBought(item: ItemType): Promise<void>;
	saveItem(item: ItemType): Promise<void>;
	removeItem(item: ItemType): void;
	setFilter(tag: string): void;
	clearFilter(): void;
	clearSearch(): void;
}

export function groceryApp(): GroceryAppState {
	return {
		// State
		items: [],
		purchased: false,
		filterTag: null,
		search: '',
		loading: true,
		error: null,
		newItem: { name: '', tags: '', notes: '', purchased: false },

		// Lifecycle
		async init() {
			console.log('[App] init called');
			const isAuthenticated = await checkAuth();
			console.log('[App] isAuthenticated:', isAuthenticated);
			if (!isAuthenticated) {
				console.log('[App] Not authenticated, redirecting to /auth.html');
				window.location.href = '/auth.html';
				return;
			}
			console.log('[App] Authenticated, loading items...');
			await this.loadItems();
		},

		// Methods
		async loadItems() {
			this.loading = true;
			this.error = null;
			try {
				this.items = await listItems(
					this.purchased,
					this.filterTag,
					this.search || null
				);
			} catch (e: unknown) {
				this.error = e instanceof Error ? e.message : 'Failed to load items';
			} finally {
				this.loading = false;
			}
		},

		async addItem() {
			this.error = null;
			try {
				await createItem(this.newItem);
				this.newItem = { name: '', tags: '', notes: '', purchased: false };
				await this.loadItems();
			} catch (e: unknown) {
				this.error = e instanceof Error ? e.message : 'Failed to create item';
			}
		},

		async toggleBought(item: ItemType) {
			try {
				if (item.purchased) {
					await needItem(item.id!);
					item.purchased = false;
				} else {
					await boughtItem(item);
					item.purchased = true;
				}
				// Reload to update the list (item moves between tabs)
				await this.loadItems();
			} catch (e: unknown) {
				this.error = e instanceof Error ? e.message : 'Failed to update item';
			}
		},

		async saveItem(item: ItemType) {
			try {
				await updateItem(item);
			} catch (e: unknown) {
				this.error = e instanceof Error ? e.message : 'Failed to save item';
			}
		},

		removeItem(item: ItemType) {
			if (confirm(`Really delete ${item.name}?`)) {
				deleteItem(item.id!);
				this.items = this.items.filter((i) => i.id !== item.id);
			}
		},

		setFilter(tag: string) {
			this.filterTag = tag;
			this.loadItems();
		},

		clearFilter() {
			this.filterTag = null;
			this.loadItems();
		},

		clearSearch() {
			this.search = '';
			this.loadItems();
		}
	};
}
