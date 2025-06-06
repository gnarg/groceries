import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    listItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    needItem,
    boughtItem,
    type ItemType 
} from './pocketbase';

// Mock the PocketBase library
const mockGetFullList = vi.fn();
const mockGetOne = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('pocketbase', () => {
    return {
        __esModule: true,
        default: vi.fn().mockImplementation(() => ({
            collection: vi.fn().mockImplementation(() => ({
                getFullList: mockGetFullList,
                getOne: mockGetOne,
                create: mockCreate,
                update: mockUpdate,
                delete: mockDelete,
            })),
        })),
    };
});

describe('PocketBase Service', () => {
    beforeEach(() => {
        // Reset mocks before each test
        mockGetFullList.mockReset();
        mockGetOne.mockReset();
        mockCreate.mockReset();
        mockUpdate.mockReset();
        mockDelete.mockReset();
    });

    describe('createItem', () => {
        it('should create an item and lowercase tags', async () => {
            const newItem: ItemType = { name: 'Test Item', tags: 'TagA TagB', purchased: false, notes: 'Test note' };
            const expectedCreatedItem = { ...newItem, id: '123', tags: 'taga tagb' }; // PocketBase would add an id
            mockCreate.mockResolvedValue(expectedCreatedItem);

            const result = await createItem(newItem);

            expect(mockCreate).toHaveBeenCalledWith({ ...newItem, tags: 'taga tagb' });
            expect(result).toEqual(expectedCreatedItem);
        });

        it('should create an item without tags', async () => {
            const newItem: ItemType = { name: 'Test Item No Tags', purchased: false, notes: 'Another note' };
            const expectedCreatedItem = { ...newItem, id: '456' }; 
            mockCreate.mockResolvedValue(expectedCreatedItem);

            const result = await createItem(newItem);

            expect(mockCreate).toHaveBeenCalledWith(newItem);
            expect(result).toEqual(expectedCreatedItem);
        });
    });

    describe('updateItem', () => {
        it('should update an item and lowercase tags', async () => {
            const itemToUpdate: ItemType = { id: '123', name: 'Updated Item', tags: 'TagC TagD', purchased: false, notes: 'Updated note' };
            const expectedItemData = { ...itemToUpdate, tags: 'tagc tagd' }; // Data sent to PocketBase
            mockUpdate.mockResolvedValue(undefined); // update doesn't return the item

            await updateItem(itemToUpdate);

            expect(mockUpdate).toHaveBeenCalledWith(itemToUpdate.id, expectedItemData);
        });

        it('should update an item without tags', async () => {
            const itemToUpdate: ItemType = { id: '456', name: 'Updated Item No Tags', purchased: true };
            mockUpdate.mockResolvedValue(undefined);

            await updateItem(itemToUpdate);

            expect(mockUpdate).toHaveBeenCalledWith(itemToUpdate.id, itemToUpdate);
        });

        it('should throw an error if no item id is provided', async () => {
            const itemToUpdate: ItemType = { name: 'Item Without ID' };
            // Use a try-catch block to assert that an error is thrown
            try {
                await updateItem(itemToUpdate);
                // If updateItem doesn't throw, this line will fail the test
                expect(true).toBe(false); 
            } catch (e: any) {
                expect(e.message).toBe('No item id provided');
            }
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });

    describe('listItems', () => {
        it('should list items with purchased = false and sort by count', async () => {
            const mockData = [
                { id: '1', name: 'Item 1', purchased: false, expand: { purchases: [{ created: new Date().toISOString() }] }, count: 0 }, // count will be recalculated
                { id: '2', name: 'Item 2', purchased: false, expand: { purchases: [] }, count: 0 },
                { id: '3', name: 'Item 3', purchased: false, count: 0 }, // no expand.purchases
            ];
            mockGetFullList.mockResolvedValue(mockData);

            const result = await listItems(false, null, null);

            expect(mockGetFullList).toHaveBeenCalledWith({ filter: 'purchased = false', expand: 'purchases', fields: '*,purchases.created_at' });
            expect(result.length).toBe(3);
            expect(result[0].id).toBe('1'); // Item 1 has 1 recent purchase
            expect(result[1].id).toBe('2'); // Item 2 has 0 recent purchases
            expect(result[2].id).toBe('3'); // Item 3 has 0 recent purchases
            expect(result[0].count).toBe(1);
            expect(result[1].count).toBe(0);
            expect(result[2].count).toBe(0);
        });

        it('should list items with purchased = true and filter by tag', async () => {
            const mockData = [
                { id: '4', name: 'Item 4', purchased: true, tags: 'food dairy', expand: { purchases: [] }, count: 0 },
            ];
            mockGetFullList.mockResolvedValue(mockData);

            const result = await listItems(true, 'food', null);

            expect(mockGetFullList).toHaveBeenCalledWith({ filter: 'purchased = true && tags ~ \'food\'', expand: 'purchases', fields: '*,purchases.created_at' });
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('4');
        });

        it('should list items and filter by search term (name)', async () => {
            const mockData = [
                { id: '5', name: 'Searchable Item', purchased: false, tags: 'other', expand: { purchases: [] }, count: 0 },
            ];
            mockGetFullList.mockResolvedValue(mockData);

            const result = await listItems(false, null, 'Searchable');

            expect(mockGetFullList).toHaveBeenCalledWith({ filter: 'purchased = false && (tags ~ \'Searchable\' || name ~ \'Searchable\')', expand: 'purchases', fields: '*,purchases.created_at' });
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('5');
        });

        it('should list items and filter by search term (tags)', async () => {
            const mockData = [
                { id: '6', name: 'Another Item', purchased: false, tags: 'findme', expand: { purchases: [] }, count: 0 },
            ];
            mockGetFullList.mockResolvedValue(mockData);

            const result = await listItems(false, null, 'findme');

            expect(mockGetFullList).toHaveBeenCalledWith({ filter: 'purchased = false && (tags ~ \'findme\' || name ~ \'findme\')', expand: 'purchases', fields: '*,purchases.created_at' });
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('6');
        });

        it('should correctly calculate count with purchases older than 30 days', async () => {
            const thirtyOneDaysAgo = new Date();
            thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
            const mockData = [
                { id: '7', name: 'Item 7', purchased: false, expand: { purchases: [{ created: thirtyOneDaysAgo.toISOString() }] }, count: 0 },
                { id: '8', name: 'Item 8', purchased: false, expand: { purchases: [{ created: new Date().toISOString() }] }, count: 0 },
            ];
            mockGetFullList.mockResolvedValue(mockData);

            const result = await listItems(false, null, null);
            expect(result.find(item => item.id === '7')?.count).toBe(0);
            expect(result.find(item => item.id === '8')?.count).toBe(1);
        });
    });

    describe('getItem', () => {
        it('should get an item by id', async () => {
            const mockItemData = { id: '789', name: 'Specific Item', purchased: false };
            mockGetOne.mockResolvedValue(mockItemData);

            const result = await getItem('789');

            expect(mockGetOne).toHaveBeenCalledWith('789');
            expect(result).toEqual(mockItemData);
        });
    });

    describe('deleteItem', () => {
        it('should delete an item by id', async () => {
            mockDelete.mockResolvedValue(undefined); // delete doesn't return anything

            await deleteItem('abc');

            expect(mockDelete).toHaveBeenCalledWith('abc');
        });
    });

    describe('needItem', () => {
        it('should mark an item as not purchased', async () => {
            mockUpdate.mockResolvedValue(undefined);

            await needItem('xyz');

            // It internally calls updateItem, so we check the arguments updateItem would call pb.collection.update with
            expect(mockUpdate).toHaveBeenCalledWith('xyz', { id: 'xyz', purchased: false }); 
        });
    });

    describe('boughtItem', () => {
        it('should mark an item as purchased, create a purchase record, and clear notes', async () => {
            const itemToBuy: ItemType = { id: 'item001', name: 'Item to Buy', purchased: false, purchases: ['p1'], notes: 'Some notes' };
            const mockPurchaseRecord = { id: 'p2', item: 'item001', created: new Date().toISOString() }; 
            mockCreate.mockResolvedValue(mockPurchaseRecord); // For groceries_purchases collection
            mockUpdate.mockResolvedValue(undefined); // For groceries_items collection

            await boughtItem(itemToBuy);

            expect(mockCreate).toHaveBeenCalledWith({ item: 'item001' });
            expect(mockUpdate).toHaveBeenCalledWith('item001', {
                id: 'item001',
                purchased: true,
                purchases: ['p1', 'p2'],
                notes: null
            });
        });

        it('should handle item with no existing purchases array', async () => {
            const itemToBuy: ItemType = { id: 'item002', name: 'Another Item to Buy', purchased: false, notes: 'More notes' }; // purchases is undefined
            const mockPurchaseRecord = { id: 'p3', item: 'item002', created: new Date().toISOString() };
            mockCreate.mockResolvedValue(mockPurchaseRecord);
            mockUpdate.mockResolvedValue(undefined);

            await boughtItem(itemToBuy);

            expect(mockCreate).toHaveBeenCalledWith({ item: 'item002' });
            expect(mockUpdate).toHaveBeenCalledWith('item002', {
                id: 'item002',
                purchased: true,
                purchases: ['p3'],
                notes: null
            });
        });
    });
});
