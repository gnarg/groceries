import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroceryAPI } from '../js/modules/pocketbase.js';
import { setupBrowserMocks } from './test-helpers.js';

// Setup test environment
setupBrowserMocks();

describe('GroceryAPI', () => {
  let api;
  let mockCollection;

  beforeEach(() => {
    api = new GroceryAPI('https://test.example.com');

    // Reset mocks
    mockCollection = {
      getFullList: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };

    // Mock the collection method
    api.pb.collection = vi.fn().mockReturnValue(mockCollection);
  });

  describe('listItems', () => {
    it('should build correct filter for purchased items', async () => {
      mockCollection.getFullList.mockResolvedValue([
        { id: '1', name: 'Milk', purchased: true, tags: 'dairy' }
      ]);

      await api.listItems(true, null, null);

      expect(mockCollection.getFullList).toHaveBeenCalledWith({
        filter: 'purchased = true',
        expand: 'purchases',
        fields: '*,purchases.created_at'
      });
    });

    it('should include tag filter when provided', async () => {
      mockCollection.getFullList.mockResolvedValue([]);

      await api.listItems(false, 'dairy', null);

      expect(mockCollection.getFullList).toHaveBeenCalledWith({
        filter: 'purchased = false && tags ~ \'dairy\'',
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

      const result = await api.listItems(false, null, null);

      expect(result[0].count).toBe(1); // Only recent purchase counts
    });
  });

  it('should lowercase tags before creating items', async () => {
    const item = { name: 'Bread', tags: 'BAKERY Gluten-Free' };
    mockCollection.create.mockResolvedValue({ id: '1', ...item });

    await api.createItem(item);

    expect(mockCollection.create).toHaveBeenCalledWith({
      name: 'Bread',
      tags: 'bakery gluten-free'
    });
  });

  it('should create purchase and update item when bought', async () => {
    const item = { id: '1', name: 'Milk', purchases: ['old-purchase'] };

    // Mock purchase collection
    const mockPurchaseCollection = { create: vi.fn().mockResolvedValue({ id: 'new-purchase' }) };
    api.pb.collection = vi.fn()
      .mockReturnValueOnce(mockPurchaseCollection) // First call for purchases
      .mockReturnValueOnce(mockCollection); // Second call for items

    mockCollection.update.mockResolvedValue({ ...item, purchased: true });

    await api.boughtItem(item);

    expect(mockPurchaseCollection.create).toHaveBeenCalledWith({ item: '1' });
    expect(mockCollection.update).toHaveBeenCalledWith('1', {
      id: '1',
      purchased: true,
      purchases: ['old-purchase', 'new-purchase'],
      notes: null
    });
  });
});
