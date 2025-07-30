import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Setup DOM environment  
const dom = new JSDOM('', { url: 'http://localhost:3000' });
global.window = dom.window;
global.document = dom.window.document;

// Create a simple location mock
global.window.location = {
  href: 'http://localhost:3000',
  assign: vi.fn(),
  replace: vi.fn()
};

// Mock globals that would be set by pocketbase.js
global.window.pb = { authStore: { isValid: true } };
global.window.groceryAPI = {
  listItems: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  boughtItem: vi.fn(),
  needItem: vi.fn()
};

// Import the module after setting up globals
await import('../js/app.js');

describe('groceryApp', () => {
  let app;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create fresh app instance
    app = window.groceryApp();
    
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
      window.pb.authStore.isValid = false;
      const listItemsSpy = vi.spyOn(window.groceryAPI, 'listItems');
      
      await app.loadItems();
      
      // Should not call API when not authenticated
      expect(listItemsSpy).not.toHaveBeenCalled();
      expect(app.items).toEqual([]);
    });

    it('should load items and ensure tags are strings', async () => {
      window.pb.authStore.isValid = true; // Ensure auth is valid
      window.groceryAPI.listItems.mockResolvedValue([
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
      window.pb.authStore.isValid = true; // Ensure auth is valid
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      window.groceryAPI.listItems.mockRejectedValue(new Error('Network error'));

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

  describe('setPurchased', () => {
    it('should update purchased state and reload items', () => {
      const loadItemsSpy = vi.spyOn(app, 'loadItems').mockImplementation(() => {});
      
      app.setPurchased(true);
      
      expect(app.purchased).toBe(true);
      expect(loadItemsSpy).toHaveBeenCalled();
    });
  });

  describe('addNewItem', () => {
    it('should not add item if name is empty', async () => {
      app.newItem.name = '   ';
      
      await app.addNewItem();
      
      expect(window.groceryAPI.createItem).not.toHaveBeenCalled();
    });

    it('should create item and reset form', async () => {
      const loadItemsSpy = vi.spyOn(app, 'loadItems').mockImplementation(() => {});
      app.newItem = { name: 'New Item', tags: 'test', notes: 'test note' };
      
      await app.addNewItem();
      
      expect(window.groceryAPI.createItem).toHaveBeenCalledWith({
        name: 'New Item',
        tags: 'test',
        notes: 'test note'
      });
      expect(app.newItem).toEqual({ name: '', tags: '', purchased: false, notes: '' });
      expect(loadItemsSpy).toHaveBeenCalled();
    });
  });
});

describe('itemComponent', () => {
  let component;
  let mockItem;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockItem = { id: '1', name: 'Test Item', purchased: false };
    component = window.itemComponent(mockItem);
    
    // Mock $dispatch
    component.$dispatch = vi.fn();
  });

  describe('togglePurchased', () => {
    it('should mark item as needed when currently purchased', async () => {
      component.item.purchased = true;
      
      await component.togglePurchased();
      
      expect(window.groceryAPI.needItem).toHaveBeenCalledWith('1');
      expect(component.item.purchased).toBe(false);
      expect(component.$dispatch).toHaveBeenCalledWith('reload-items');
    });

    it('should mark item as bought when not purchased', async () => {
      component.item.purchased = false;
      
      await component.togglePurchased();
      
      expect(window.groceryAPI.boughtItem).toHaveBeenCalledWith(mockItem);
      expect(component.item.purchased).toBe(true);
      expect(component.$dispatch).toHaveBeenCalledWith('reload-items');
    });
  });

  describe('updateItem', () => {
    it('should update item and switch to view mode', async () => {
      component.mode = 'edit';
      
      await component.updateItem();
      
      expect(window.groceryAPI.updateItem).toHaveBeenCalledWith(mockItem);
      expect(component.mode).toBe('view');
      expect(component.$dispatch).toHaveBeenCalledWith('reload-items');
    });
  });

  describe('deleteItem', () => {
    it('should delete item after confirmation', async () => {
      // Mock window.confirm
      global.confirm = vi.fn().mockReturnValue(true);
      
      await component.deleteItem();
      
      expect(confirm).toHaveBeenCalledWith('Really delete Test Item?');
      expect(window.groceryAPI.deleteItem).toHaveBeenCalledWith('1');
      expect(component.$dispatch).toHaveBeenCalledWith('reload-items');
    });

    it('should not delete item if not confirmed', async () => {
      global.confirm = vi.fn().mockReturnValue(false);
      
      await component.deleteItem();
      
      expect(window.groceryAPI.deleteItem).not.toHaveBeenCalled();
    });
  });
});