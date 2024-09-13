import PocketBase from 'pocketbase';

const pb = new PocketBase('https://db.guymon.family');

let getItems = async (purchased: boolean, tag: string | null, search: string | null) => {
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
        Date.parse(purchase.created) > Date.now() - 1000 * 60 * 60 * 24 * 30);
      item.count = recentPurchases.length;
    } else {
      item.count = 0;
    }
    return item;
  });
  console.log(items);
  return items.sort((a, b) => a.count > b.count ? -1 : 1);
};

export { getItems };
