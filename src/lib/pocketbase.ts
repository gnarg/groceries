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
  const results = await pb.collection('groceries_items').getFullList({ filter });
  // TODO compute purchase count
  return results;
};

export { getItems };
