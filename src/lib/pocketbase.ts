import PocketBase from 'pocketbase';

const pb = new PocketBase('https://db.guymon.family');

type ItemType = {
  id?: string;
  name?: string;
  tags?: string;
  purchased?: boolean;
  purchases?: string[];
  notes?: string; // Optional notes field for items in 'need' state
};

const listItems = async (purchased: boolean, tag: string | null, search: string | null) => {
  let filter = `purchased = ${purchased}`;
  if (tag) {
    filter += ` && tags ~ '${tag}'`;
  }
  if (search) {
    filter += ` && (tags ~ '${search}' || name ~ '${search}')`;
  }
  const results = await pb.collection('groceries_items').getFullList({ filter, expand: 'purchases', fields: '*,purchases.created_at' });
  let items = results.map((item) => {
    if (item.expand && item.expand.purchases) {
      let recentPurchases = item.expand.purchases.filter((purchase: any) =>
        Date.parse(purchase.created) > Date.now() - 1000 * 60 * 60 * 24 * 30); // 30 days
      item.count = recentPurchases.length;
    } else {
      item.count = 0;
    }
    return item;
  });
  return items.sort((a, b) => a.count > b.count ? -1 : 1);
};

const getItem = (id: string) => {
  return pb.collection('groceries_items').getOne(id);
}

const createItem = (item: ItemType) => {
  if (item.tags) {
    item.tags = item.tags.toLowerCase();
  }
  return pb.collection('groceries_items').create(item);
}

const updateItem = (item: ItemType) => {
  if (!item.id) {
    throw new Error('No item id provided');
  }
  if (item.tags) {
    item.tags = item.tags.toLowerCase();
  }
  pb.collection('groceries_items').update(item.id, item);
}

const deleteItem = (id: string) => {
  pb.collection('groceries_items').delete(id);
}

const needItem = (id: string) => {
  updateItem({id: id, purchased: false });
}

const boughtItem = async (item: ItemType) => {
  const purchase = await pb.collection('groceries_purchases').create({ item: item.id });
  if (!item.purchases) {
    item.purchases = [];
  }
  updateItem({id: item.id!, purchased: true, purchases: item.purchases.concat(purchase.id), notes: null }); // Clear notes when item is bought
}

export { listItems, getItem, createItem, updateItem, deleteItem, needItem, boughtItem };
export type { ItemType };