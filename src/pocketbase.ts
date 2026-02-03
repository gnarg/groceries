import PocketBase from 'pocketbase';
import type { ItemType, NewItemForm } from './types';

export const pb = new PocketBase('https://db.guymon.family');

export async function listItems(
	purchased: boolean,
	tag: string | null,
	search: string | null
): Promise<ItemType[]> {
	let filter = `purchased = ${purchased}`;
	if (tag) {
		filter += ` && tags ~ '${tag}'`;
	}
	if (search) {
		filter += ` && (tags ~ '${search}' || name ~ '${search}')`;
	}

	const results = await pb.collection('groceries_items').getFullList({
		filter,
		expand: 'purchases',
		fields: '*,purchases.created_at',
		requestKey: null // Disable auto-cancellation to prevent errors on concurrent loads
	});

	const items: ItemType[] = results.map((item) => {
		let count = 0;
		if (item.expand && item.expand.purchases) {
			const recentPurchases = item.expand.purchases.filter(
				(purchase: { created: string }) =>
					Date.parse(purchase.created) > Date.now() - 1000 * 60 * 60 * 24 * 30
			);
			count = recentPurchases.length;
		}
		return {
			id: item.id,
			name: item.name,
			tags: item.tags,
			purchased: item.purchased,
			purchases: item.purchases,
			notes: item.notes,
			count
		};
	});

	return items.sort((a, b) => ((a.count ?? 0) > (b.count ?? 0) ? -1 : 1));
}

export async function getItem(id: string): Promise<ItemType> {
	const item = await pb.collection('groceries_items').getOne(id);
	return {
		id: item.id,
		name: item.name,
		tags: item.tags,
		purchased: item.purchased,
		purchases: item.purchases,
		notes: item.notes
	};
}

export async function createItem(item: NewItemForm): Promise<ItemType> {
	const data = {
		...item,
		tags: item.tags ? item.tags.toLowerCase() : ''
	};
	const result = await pb.collection('groceries_items').create(data);
	return {
		id: result.id,
		name: result.name,
		tags: result.tags,
		purchased: result.purchased,
		purchases: result.purchases,
		notes: result.notes
	};
}

export async function updateItem(item: ItemType): Promise<void> {
	if (!item.id) {
		throw new Error('No item id provided');
	}
	const data = {
		...item,
		tags: item.tags ? item.tags.toLowerCase() : item.tags
	};
	await pb.collection('groceries_items').update(item.id, data);
}

export async function deleteItem(id: string): Promise<void> {
	await pb.collection('groceries_items').delete(id);
}

export async function needItem(id: string): Promise<void> {
	await updateItem({ id, purchased: false });
}

export async function boughtItem(item: ItemType): Promise<void> {
	const purchase = await pb.collection('groceries_purchases').create({ item: item.id });
	const purchases = item.purchases ? [...item.purchases, purchase.id] : [purchase.id];
	await updateItem({
		id: item.id,
		purchased: true,
		purchases,
		notes: undefined // Clear notes when item is bought
	});
}
