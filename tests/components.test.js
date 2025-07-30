import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGroceryApp, createItemComponent } from '../js/modules/components.js';
import { createMockAPI, setupBrowserMocks } from './test-helpers.js';

// Setup test environment
setupBrowserMocks();

describe('createGroceryApp', () => {
  let app;
  let mockAPI;

  beforeEach(() => {
    mockAPI = createMockAPI();
    app = createGroceryApp(mockAPI);
    vi.clearAllMocks();

    // Reset app state
    app.purchased = false;
    app.items = [];
    app.loading = false;
    app.search = null;
    app.filterTag = null;
    app.newItem = { name: '', tags: '', purchased: false, notes: '' };
  });

  describe('loadItems', () => {
    it('should return early when not authenticated', async () => {
      mockAPI.authStore.isValid = false;

      await app.loadItems();

      expect(mockAPI.listItems).not.toHaveBeenCalled();
      expect(app.items).toEqual([]);
    });

    it('should load items and ensure tags are strings', async () => {
      mockAPI.authStore.isValid = true;
      mockAPI.listItems.mockResolvedValue([
        { id: '1', name: 'Milk', tags: 'dairy' },
        { id: '2', name: 'Bread', tags: null }
      ]);

      await app.loadItems();

      expect(app.items).toEqual([
        { id: '1', name: 'Milk', tags: 'dairy' },
        { id: '2', name: 'Bread', tags: '' }
      ]);
      expect(app.loading).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAPI.listItems.mockRejectedValue(new Error('Network error'));

      await app.loadItems();

      expect(app.items).toEqual([]);
      expect(app.loading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading items:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('debouncedLoadItems', () => {
    it('should debounce loadItems calls', () => {
      vi.useFakeTimers();
      const loadItemsSpy = vi.spyOn(app, 'loadItems').mockImplementation(() => {});

      app.debouncedLoadItems();
      app.debouncedLoadItems();
      app.debouncedLoadItems();

      expect(loadItemsSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      expect(loadItemsSpy).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  it('should create item and reset form when adding new item', async () => {
    const loadItemsSpy = vi.spyOn(app, 'loadItems').mockImplementation(() => {});
    app.newItem = { name: 'New Item', tags: 'test', notes: 'test note' };

    await app.addNewItem();

    expect(mockAPI.createItem).toHaveBeenCalledWith({
      name: 'New Item',
      tags: 'test',
      notes: 'test note'
    });
    expect(app.newItem).toEqual({ name: '', tags: '', purchased: false, notes: '' });
    expect(loadItemsSpy).toHaveBeenCalled();
  });

  it('should not add item if name is empty', async () => {
    app.newItem.name = '   ';

    await app.addNewItem();

    expect(mockAPI.createItem).not.toHaveBeenCalled();
  });
});

describe('createItemComponent', () => {
  let component;
  let mockItem;
  let mockAPI;

  beforeEach(() => {
    mockAPI = createMockAPI();
    mockItem = { id: '1', name: 'Test Item', purchased: false };
    component = createItemComponent(mockItem, mockAPI);

    // Mock $dispatch
    component.$dispatch = vi.fn();
    vi.clearAllMocks();
  });

  describe('togglePurchased', () => {
    it('should mark item as needed when currently purchased', async () => {
      component.item.purchased = true;

      await component.togglePurchased();

      expect(mockAPI.needItem).toHaveBeenCalledWith('1');
      expect(component.item.purchased).toBe(false);
      expect(component.$dispatch).toHaveBeenCalledWith('reload-items');
    });

    it('should mark item as bought when not purchased', async () => {
      component.item.purchased = false;

      await component.togglePurchased();

      expect(mockAPI.boughtItem).toHaveBeenCalledWith(mockItem);
      expect(component.item.purchased).toBe(true);
      expect(component.$dispatch).toHaveBeenCalledWith('reload-items');
    });
  });

  describe('updateItem', () => {
    it('should update item and switch to view mode', async () => {
      component.mode = 'edit';

      await component.updateItem();

      expect(mockAPI.updateItem).toHaveBeenCalledWith(mockItem);
      expect(component.mode).toBe('view');
      expect(component.$dispatch).toHaveBeenCalledWith('reload-items');
    });
  });

  describe('deleteItem', () => {
    it('should delete item after confirmation', async () => {
      global.confirm.mockReturnValue(true);

      await component.deleteItem();

      expect(confirm).toHaveBeenCalledWith('Really delete Test Item?');
      expect(mockAPI.deleteItem).toHaveBeenCalledWith('1');
      expect(component.$dispatch).toHaveBeenCalledWith('reload-items');
    });

    it('should not delete item if not confirmed', async () => {
      global.confirm.mockReturnValue(false);

      await component.deleteItem();

      expect(mockAPI.deleteItem).not.toHaveBeenCalled();
    });
  });
});
