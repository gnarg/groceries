import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PocketBase before importing the module
vi.mock('pocketbase', () => {
	const mockCollection = vi.fn();
	return {
		default: vi.fn().mockImplementation(() => ({
			collection: mockCollection
		}))
	};
});

import {
	listItems,
	createItem,
	updateItem,
	deleteItem,
	boughtItem,
	needItem,
	pb
} from '../src/pocketbase';

describe('PocketBase Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('listItems', () => {
		it('should fetch items with purchased filter', async () => {
			const mockItems = [
				{ id: '1', name: 'Milk', tags: 'dairy', purchased: false, purchases: [], notes: '' },
				{ id: '2', name: 'Bread', tags: 'bakery', purchased: false, purchases: [], notes: '' }
			];

			const mockGetFullList = vi.fn().mockResolvedValue(mockItems);
			vi.mocked(pb.collection).mockReturnValue({
				getFullList: mockGetFullList
			} as any);

			const result = await listItems(false, null, null);

			expect(pb.collection).toHaveBeenCalledWith('groceries_items');
			expect(mockGetFullList).toHaveBeenCalledWith({
				filter: 'purchased = false',
				expand: 'purchases',
				fields: '*,purchases.created_at',
				requestKey: null
			});
			expect(result).toHaveLength(2);
		});

		it('should add tag filter when provided', async () => {
			const mockGetFullList = vi.fn().mockResolvedValue([]);
			vi.mocked(pb.collection).mockReturnValue({
				getFullList: mockGetFullList
			} as any);

			await listItems(false, 'dairy', null);

			expect(mockGetFullList).toHaveBeenCalledWith({
				filter: "purchased = false && tags ~ 'dairy'",
				expand: 'purchases',
				fields: '*,purchases.created_at',
				requestKey: null
			});
		});

		it('should add search filter when provided', async () => {
			const mockGetFullList = vi.fn().mockResolvedValue([]);
			vi.mocked(pb.collection).mockReturnValue({
				getFullList: mockGetFullList
			} as any);

			await listItems(true, null, 'milk');

			expect(mockGetFullList).toHaveBeenCalledWith({
				filter: "purchased = true && (tags ~ 'milk' || name ~ 'milk')",
				expand: 'purchases',
				fields: '*,purchases.created_at',
				requestKey: null
			});
		});

		it('should calculate purchase count from last 30 days', async () => {
			const now = Date.now();
			const recentDate = new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(); // 10 days ago
			const oldDate = new Date(now - 1000 * 60 * 60 * 24 * 60).toISOString(); // 60 days ago

			const mockItems = [
				{
					id: '1',
					name: 'Milk',
					tags: 'dairy',
					purchased: false,
					purchases: ['p1', 'p2', 'p3'],
					notes: '',
					expand: {
						purchases: [
							{ created: recentDate },
							{ created: recentDate },
							{ created: oldDate }
						]
					}
				}
			];

			const mockGetFullList = vi.fn().mockResolvedValue(mockItems);
			vi.mocked(pb.collection).mockReturnValue({
				getFullList: mockGetFullList
			} as any);

			const result = await listItems(false, null, null);

			expect(result[0].count).toBe(2); // Only 2 recent purchases
		});

		it('should sort items by purchase count descending', async () => {
			const recentDate = new Date().toISOString();
			const mockItems = [
				{
					id: '1',
					name: 'Rarely Bought',
					tags: '',
					purchased: false,
					purchases: [],
					notes: '',
					expand: { purchases: [] }
				},
				{
					id: '2',
					name: 'Often Bought',
					tags: '',
					purchased: false,
					purchases: ['p1', 'p2'],
					notes: '',
					expand: {
						purchases: [{ created: recentDate }, { created: recentDate }]
					}
				}
			];

			const mockGetFullList = vi.fn().mockResolvedValue(mockItems);
			vi.mocked(pb.collection).mockReturnValue({
				getFullList: mockGetFullList
			} as any);

			const result = await listItems(false, null, null);

			expect(result[0].name).toBe('Often Bought');
			expect(result[1].name).toBe('Rarely Bought');
		});
	});

	describe('createItem', () => {
		it('should create item with lowercase tags', async () => {
			const mockCreate = vi.fn().mockResolvedValue({
				id: 'new-id',
				name: 'New Item',
				tags: 'dairy snacks',
				purchased: false,
				purchases: [],
				notes: ''
			});
			vi.mocked(pb.collection).mockReturnValue({
				create: mockCreate
			} as any);

			const result = await createItem({
				name: 'New Item',
				tags: 'DAIRY SNACKS',
				notes: '',
				purchased: false
			});

			expect(mockCreate).toHaveBeenCalledWith({
				name: 'New Item',
				tags: 'dairy snacks',
				notes: '',
				purchased: false
			});
			expect(result.id).toBe('new-id');
		});
	});

	describe('updateItem', () => {
		it('should update item with lowercase tags', async () => {
			const mockUpdate = vi.fn().mockResolvedValue({});
			vi.mocked(pb.collection).mockReturnValue({
				update: mockUpdate
			} as any);

			await updateItem({
				id: '123',
				name: 'Updated',
				tags: 'NEW TAGS'
			});

			expect(mockUpdate).toHaveBeenCalledWith('123', {
				id: '123',
				name: 'Updated',
				tags: 'new tags'
			});
		});

		it('should throw error if no id provided', async () => {
			await expect(updateItem({ name: 'No ID' })).rejects.toThrow('No item id provided');
		});
	});

	describe('deleteItem', () => {
		it('should delete item by id', async () => {
			const mockDelete = vi.fn().mockResolvedValue({});
			vi.mocked(pb.collection).mockReturnValue({
				delete: mockDelete
			} as any);

			await deleteItem('123');

			expect(pb.collection).toHaveBeenCalledWith('groceries_items');
			expect(mockDelete).toHaveBeenCalledWith('123');
		});
	});

	describe('needItem', () => {
		it('should mark item as not purchased', async () => {
			const mockUpdate = vi.fn().mockResolvedValue({});
			vi.mocked(pb.collection).mockReturnValue({
				update: mockUpdate
			} as any);

			await needItem('123');

			expect(mockUpdate).toHaveBeenCalledWith('123', {
				id: '123',
				purchased: false
			});
		});
	});

	describe('boughtItem', () => {
		it('should create purchase record and update item', async () => {
			const mockCreate = vi.fn().mockResolvedValue({ id: 'purchase-1' });
			const mockUpdate = vi.fn().mockResolvedValue({});

			vi.mocked(pb.collection).mockImplementation((name: string) => {
				if (name === 'groceries_purchases') {
					return { create: mockCreate } as any;
				}
				return { update: mockUpdate } as any;
			});

			await boughtItem({
				id: 'item-1',
				name: 'Milk',
				purchases: ['old-purchase']
			});

			expect(mockCreate).toHaveBeenCalledWith({ item: 'item-1' });
			expect(mockUpdate).toHaveBeenCalledWith('item-1', {
				id: 'item-1',
				purchased: true,
				purchases: ['old-purchase', 'purchase-1'],
				notes: undefined
			});
		});

		it('should handle item with no existing purchases', async () => {
			const mockCreate = vi.fn().mockResolvedValue({ id: 'purchase-1' });
			const mockUpdate = vi.fn().mockResolvedValue({});

			vi.mocked(pb.collection).mockImplementation((name: string) => {
				if (name === 'groceries_purchases') {
					return { create: mockCreate } as any;
				}
				return { update: mockUpdate } as any;
			});

			await boughtItem({
				id: 'item-1',
				name: 'New Item'
			});

			expect(mockUpdate).toHaveBeenCalledWith('item-1', {
				id: 'item-1',
				purchased: true,
				purchases: ['purchase-1'],
				notes: undefined
			});
		});
	});
});
