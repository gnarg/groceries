// PocketBase API module
export class GroceryAPI {
  constructor(baseUrl) {
    this.pb = new PocketBase(baseUrl);
  }

  get authStore() {
    return this.pb.authStore;
  }

  async listItems(purchased, tag, search) {
    let filter = `purchased = ${purchased}`;
    if (tag) filter += ` && tags ~ '${tag}'`;
    if (search) filter += ` && (tags ~ '${search}' || name ~ '${search}')`;
    
    const results = await this.pb.collection('groceries_items').getFullList({ 
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
  }

  async createItem(item) {
    if (item.tags) item.tags = item.tags.toLowerCase();
    return this.pb.collection('groceries_items').create(item);
  }

  async updateItem(item) {
    if (!item.id) throw new Error('No item id provided');
    if (item.tags) item.tags = item.tags.toLowerCase();
    return this.pb.collection('groceries_items').update(item.id, item);
  }

  async deleteItem(id) {
    return this.pb.collection('groceries_items').delete(id);
  }

  async needItem(id) {
    return this.updateItem({ id, purchased: false });
  }

  async boughtItem(item) {
    const purchase = await this.pb.collection('groceries_purchases').create({ item: item.id });
    return this.updateItem({
      id: item.id,
      purchased: true,
      purchases: (item.purchases || []).concat(purchase.id),
      notes: null
    });
  }
}