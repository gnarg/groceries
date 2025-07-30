import { vi } from 'vitest';

// Mock PocketBase for testing
export class MockPocketBase {
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

// Mock API factory
export const createMockAPI = () => ({
  authStore: { isValid: true },
  listItems: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  boughtItem: vi.fn(),
  needItem: vi.fn()
});

// Setup globals needed for browser environment
export const setupBrowserMocks = () => {
  global.window = { location: { href: '' } };
  global.confirm = vi.fn();
  global.PocketBase = MockPocketBase;
};