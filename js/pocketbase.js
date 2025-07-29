import PocketBase from 'https://cdn.jsdelivr.net/npm/pocketbase@0.21.5/dist/pocketbase.es.mjs';

const pb = new PocketBase('https://db.guymon.family');

/**
 * @typedef {Object} ItemType
 * @property {string} [id] - Item ID
 * @property {string} [name] - Item name
 * @property {string} [tags] - Item tags
 * @property {boolean} [purchased] - Purchase status
 * @property {string[]} [purchases] - Array of purchase IDs
 * @property {string} [notes] - Optional notes for items in 'need' state
 */

const listItems = async (purchased, tag, search) => {
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
      let recentPurchases = item.expand.purchases.filter((purchase) =>
        Date.parse(purchase.created) > Date.now() - 1000 * 60 * 60 * 24 * 30); // 30 days
      item.count = recentPurchases.length;
    } else {
      item.count = 0;
    }
    return item;
  });
  return items.sort((a, b) => a.count > b.count ? -1 : 1);
};

const getItem = (id) => {
  return pb.collection('groceries_items').getOne(id);
}

const createItem = (item) => {
  if (item.tags) {
    item.tags = item.tags.toLowerCase();
  }
  return pb.collection('groceries_items').create(item);
}

const updateItem = (item) => {
  if (!item.id) {
    throw new Error('No item id provided');
  }
  if (item.tags) {
    item.tags = item.tags.toLowerCase();
  }
  pb.collection('groceries_items').update(item.id, item);
}

const deleteItem = (id) => {
  pb.collection('groceries_items').delete(id);
}

const needItem = (id) => {
  updateItem({id: id, purchased: false });
}

const boughtItem = async (item) => {
  const purchase = await pb.collection('groceries_purchases').create({ item: item.id });
  if (!item.purchases) {
    item.purchases = [];
  }
  updateItem({id: item.id, purchased: true, purchases: item.purchases.concat(purchase.id), notes: null }); // Clear notes when item is bought
}

export { listItems, getItem, createItem, updateItem, deleteItem, needItem, boughtItem };