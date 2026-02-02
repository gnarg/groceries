import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the pocketbase module
vi.mock('../src/pocketbase', () => ({
	listItems: vi.fn(),
	createItem: vi.fn(),
	updateItem: vi.fn(),
	deleteItem: vi.fn(),
	boughtItem: vi.fn(),
	needItem: vi.fn()
}));

// Mock the auth module
vi.mock('../src/auth', () => ({
	checkAuth: vi.fn()
}));

import { groceryApp } from '../src/app';
import * as pocketbase from '../src/pocketbase';
import * as auth from '../src/auth';

describe('groceryApp', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset window.location mock
		Object.defineProperty(window, 'location', {
			value: { href: '' },
			writable: true
		});
	});

	describe('initial state', () => {
		it('should have correct default state', () => {
			const app = groceryApp();

			expect(app.items).toEqual([]);
			expect(app.purchased).toBe(false);
			expect(app.filterTag).toBeNull();
			expect(app.search).toBe('');
			expect(app.loading).toBe(true);
			expect(app.error).toBeNull();
			expect(app.newItem).toEqual({
				name: '',
				tags: '',
				notes: '',
				purchased: false
			});
		});
	});

	describe('init', () => {
		it('should redirect to auth if not authenticated', async () => {
			vi.mocked(auth.checkAuth).mockResolvedValue(false);

			const app = groceryApp();
			await app.init();

			expect(auth.checkAuth).toHaveBeenCalled();
			expect(window.location.href).toBe('/auth.html');
		});

		it('should load items if authenticated', async () => {
			vi.mocked(auth.checkAuth).mockResolvedValue(true);
			vi.mocked(pocketbase.listItems).mockResolvedValue([
				{ id: '1', name: 'Milk', tags: 'dairy', purchased: false }
			]);

			const app = groceryApp();
			await app.init();

			expect(auth.checkAuth).toHaveBeenCalled();
			expect(pocketbase.listItems).toHaveBeenCalledWith(false, null, null);
			expect(app.items).toHaveLength(1);
		});
	});

	describe('loadItems', () => {
		it('should fetch items with current filters', async () => {
			vi.mocked(pocketbase.listItems).mockResolvedValue([
				{ id: '1', name: 'Milk', tags: 'dairy', purchased: false }
			]);

			const app = groceryApp();
			app.purchased = true;
			app.filterTag = 'dairy';
			app.search = 'milk';

			await app.loadItems();

			expect(pocketbase.listItems).toHaveBeenCalledWith(true, 'dairy', 'milk');
			expect(app.items).toHaveLength(1);
			expect(app.loading).toBe(false);
		});

		it('should set error on failure', async () => {
			vi.mocked(pocketbase.listItems).mockRejectedValue(new Error('Network error'));

			const app = groceryApp();
			await app.loadItems();

			expect(app.error).toBe('Network error');
			expect(app.loading).toBe(false);
		});

		it('should pass null for empty search', async () => {
			vi.mocked(pocketbase.listItems).mockResolvedValue([]);

			const app = groceryApp();
			app.search = '';

			await app.loadItems();

			expect(pocketbase.listItems).toHaveBeenCalledWith(false, null, null);
		});
	});

	describe('addItem', () => {
		it('should create item and reset form', async () => {
			vi.mocked(pocketbase.createItem).mockResolvedValue({ id: 'new' });
			vi.mocked(pocketbase.listItems).mockResolvedValue([]);

			const app = groceryApp();
			app.newItem = { name: 'Bread', tags: 'bakery', notes: 'whole wheat', purchased: false };

			await app.addItem();

			expect(pocketbase.createItem).toHaveBeenCalledWith({
				name: 'Bread',
				tags: 'bakery',
				notes: 'whole wheat',
				purchased: false
			});
			expect(app.newItem).toEqual({ name: '', tags: '', notes: '', purchased: false });
		});

		it('should set error on failure', async () => {
			vi.mocked(pocketbase.createItem).mockRejectedValue(new Error('Create failed'));

			const app = groceryApp();
			app.newItem = { name: 'Test', tags: '', notes: '', purchased: false };

			await app.addItem();

			expect(app.error).toBe('Create failed');
		});
	});

	describe('toggleBought', () => {
		it('should mark purchased item as needed', async () => {
			vi.mocked(pocketbase.needItem).mockResolvedValue(undefined);
			vi.mocked(pocketbase.listItems).mockResolvedValue([]);

			const app = groceryApp();
			const item = { id: '1', name: 'Milk', purchased: true };

			await app.toggleBought(item);

			expect(pocketbase.needItem).toHaveBeenCalledWith('1');
			expect(item.purchased).toBe(false);
		});

		it('should mark needed item as purchased', async () => {
			vi.mocked(pocketbase.boughtItem).mockResolvedValue(undefined);
			vi.mocked(pocketbase.listItems).mockResolvedValue([]);

			const app = groceryApp();
			const item = { id: '1', name: 'Milk', purchased: false };

			await app.toggleBought(item);

			expect(pocketbase.boughtItem).toHaveBeenCalledWith(item);
			expect(item.purchased).toBe(true);
		});
	});

	describe('saveItem', () => {
		it('should update item', async () => {
			vi.mocked(pocketbase.updateItem).mockResolvedValue(undefined);

			const app = groceryApp();
			const item = { id: '1', name: 'Updated Milk', tags: 'dairy' };

			await app.saveItem(item);

			expect(pocketbase.updateItem).toHaveBeenCalledWith(item);
		});

		it('should set error on failure', async () => {
			vi.mocked(pocketbase.updateItem).mockRejectedValue(new Error('Update failed'));

			const app = groceryApp();
			await app.saveItem({ id: '1', name: 'Test' });

			expect(app.error).toBe('Update failed');
		});
	});

	describe('removeItem', () => {
		it('should delete item after confirmation', async () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			vi.mocked(pocketbase.deleteItem).mockResolvedValue(undefined);

			const app = groceryApp();
			app.items = [
				{ id: '1', name: 'Milk' },
				{ id: '2', name: 'Bread' }
			];

			app.removeItem({ id: '1', name: 'Milk' });

			expect(window.confirm).toHaveBeenCalledWith('Really delete Milk?');
			expect(pocketbase.deleteItem).toHaveBeenCalledWith('1');
			expect(app.items).toHaveLength(1);
			expect(app.items[0].id).toBe('2');
		});

		it('should not delete if confirmation cancelled', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(false);

			const app = groceryApp();
			app.items = [{ id: '1', name: 'Milk' }];

			app.removeItem({ id: '1', name: 'Milk' });

			expect(pocketbase.deleteItem).not.toHaveBeenCalled();
			expect(app.items).toHaveLength(1);
		});
	});

	describe('filter methods', () => {
		beforeEach(() => {
			vi.mocked(pocketbase.listItems).mockResolvedValue([]);
		});

		it('setFilter should set filterTag and reload', async () => {
			const app = groceryApp();

			app.setFilter('dairy');

			expect(app.filterTag).toBe('dairy');
		});

		it('clearFilter should clear filterTag and reload', async () => {
			const app = groceryApp();
			app.filterTag = 'dairy';

			app.clearFilter();

			expect(app.filterTag).toBeNull();
		});

		it('clearSearch should clear search and reload', async () => {
			const app = groceryApp();
			app.search = 'milk';

			app.clearSearch();

			expect(app.search).toBe('');
		});
	});
});
