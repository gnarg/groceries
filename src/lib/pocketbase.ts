import PocketBase from 'pocketbase';

const pb = new PocketBase('https://db.guymon.family');

type Item = {
  id: string;
  name: string;
  tags: string;
  purchased: boolean;
  purchases: string[];
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
    if (item.expand) {
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

const createItem = (item: Item) => {
  item.tags = item.tags.toLowerCase();
  return pb.collection('groceries_items').create(item);
}

const updateItem = (id: string, item: any) => {
  if (item.tags) {
    item.tags = item.tags.toLowerCase();
  }
  pb.collection('groceries_items').update(id, item);
}

const deleteItem = (id: string) => {
  pb.collection('groceries_items').delete(id);
}

const needItem = (id: string) => {
  updateItem(id, { purchased: false });
}

const boughtItem = async (item: Item) => {
  const purchase = await pb.collection('groceries_purchases').create({ item: item.id });
  if (!item.purchases) {
    item.purchases = [];
  }
  updateItem(item.id, { purchased: true, purchases: item.purchases.concat(purchase.id) });
}

export { listItems, getItem, createItem, updateItem, deleteItem, needItem, boughtItem };
