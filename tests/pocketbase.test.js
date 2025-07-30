import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock PocketBase
class MockPocketBase {
  constructor(url) {
    this.url = url;
    this.authStore = { isValid: true };
  }
  
  collection(name) {
    return {
      getFullList: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };
  }
}

// Setup DOM environment
const dom = new JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.PocketBase = MockPocketBase;

// Import the module after setting up globals
await import('../js/pocketbase.js');

describe('PocketBase API', () => {
  let mockCollection;
  
  beforeEach(() => {
    // Reset mocks
    mockCollection = {
      getFullList: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };
    
    // Mock the collection method
    window.pb.collection = vi.fn().mockReturnValue(mockCollection);
  });

  describe('listItems', () => {
    it('should build correct filter for purchased items', async () => {
      mockCollection.getFullList.mockResolvedValue([
        { id: '1', name: 'Milk', purchased: true, tags: 'dairy' }
      ]);

      await window.groceryAPI.listItems(true, null, null);
      
      expect(mockCollection.getFullList).toHaveBeenCalledWith({
        filter: 'purchased = true',
        expand: 'purchases',
        fields: '*,purchases.created_at'
      });
    });

    it('should include tag filter when provided', async () => {
      mockCollection.getFullList.mockResolvedValue([]);

      await window.groceryAPI.listItems(false, 'dairy', null);
      
      expect(mockCollection.getFullList).toHaveBeenCalledWith({
        filter: 'purchased = false && tags ~ \'dairy\'',
        expand: 'purchases',
        fields: '*,purchases.created_at'
      });
    });

    it('should include search filter when provided', async () => {
      mockCollection.getFullList.mockResolvedValue([]);

      await window.groceryAPI.listItems(false, null, 'milk');
      
      expect(mockCollection.getFullList).toHaveBeenCalledWith({
        filter: 'purchased = false && (tags ~ \'milk\' || name ~ \'milk\')',
        expand: 'purchases',
        fields: '*,purchases.created_at'
      });
    });

    it('should calculate recent purchase count', async () => {
      const now = Date.now();
      const recentDate = new Date(now - 1000 * 60 * 60 * 24 * 15).toISOString(); // 15 days ago
      const oldDate = new Date(now - 1000 * 60 * 60 * 24 * 45).toISOString(); // 45 days ago
      
      mockCollection.getFullList.mockResolvedValue([
        {
          id: '1',
          name: 'Milk',
          expand: {
            purchases: [
              { created: recentDate },
              { created: oldDate }
            ]
          }
        }
      ]);

      const result = await window.groceryAPI.listItems(false, null, null);
      
      expect(result[0].count).toBe(1); // Only recent purchase counts
    });
  });

  describe('createItem', () => {
    it('should lowercase tags before creating', async () => {
      const item = { name: 'Bread', tags: 'BAKERY Gluten-Free' };
      mockCollection.create.mockResolvedValue({ id: '1', ...item });

      await window.groceryAPI.createItem(item);
      
      expect(mockCollection.create).toHaveBeenCalledWith({
        name: 'Bread',
        tags: 'bakery gluten-free'
      });
    });
  });

  describe('boughtItem', () => {
    it('should create purchase and update item', async () => {
      const item = { id: '1', name: 'Milk', purchases: ['old-purchase'] };
      
      // Mock purchase collection
      const mockPurchaseCollection = { create: vi.fn().mockResolvedValue({ id: 'new-purchase' }) };
      window.pb.collection = vi.fn()
        .mockReturnValueOnce(mockPurchaseCollection) // First call for purchases
        .mockReturnValueOnce(mockCollection); // Second call for items

      mockCollection.update.mockResolvedValue({ ...item, purchased: true });

      await window.groceryAPI.boughtItem(item);
      
      expect(mockPurchaseCollection.create).toHaveBeenCalledWith({ item: '1' });
      expect(mockCollection.update).toHaveBeenCalledWith('1', {
        id: '1',
        purchased: true,
        purchases: ['old-purchase', 'new-purchase'],
        notes: null
      });
    });
  });
});
