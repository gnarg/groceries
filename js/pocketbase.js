// Simplified PocketBase setup
const pb = new PocketBase('https://db.guymon.family');

// PocketBase functions
const listItems = async (purchased, tag, search) => {
  let filter = `purchased = ${purchased}`;
  if (tag) filter += ` && tags ~ '${tag}'`;
  if (search) filter += ` && (tags ~ '${search}' || name ~ '${search}')`;
  
  const results = await pb.collection('groceries_items').getFullList({ 
    filter, 
    expand: 'purchases', 
    fields: '*,purchases.created_at' 
  });
  
  return results.map((item) => {
    if (item.expand?.purchases) {
      const recentPurchases = item.expand.purchases.filter(purchase =>
        Date.parse(purchase.created) > Date.now() - 1000 * 60 * 60 * 24 * 30
      );
      item.count = recentPurchases.length;
    } else {
      item.count = 0;
    }
    return item;
  }).sort((a, b) => a.count > b.count ? -1 : 1);
};

const createItem = (item) => {
  if (item.tags) item.tags = item.tags.toLowerCase();
  return pb.collection('groceries_items').create(item);
};

const updateItem = (item) => {
  if (!item.id) throw new Error('No item id provided');
  if (item.tags) item.tags = item.tags.toLowerCase();
  return pb.collection('groceries_items').update(item.id, item);
};

const deleteItem = (id) => pb.collection('groceries_items').delete(id);

const needItem = (id) => updateItem({ id, purchased: false });

const boughtItem = async (item) => {
  const purchase = await pb.collection('groceries_purchases').create({ item: item.id });
  return updateItem({
    id: item.id,
    purchased: true,
    purchases: (item.purchases || []).concat(purchase.id),
    notes: null
  });
};

// Export to global scope
window.pb = pb;
window.groceryAPI = { listItems, createItem, updateItem, deleteItem, needItem, boughtItem };