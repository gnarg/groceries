import PocketBase from 'pocketbase';

const pb = new PocketBase('https://db.guymon.family');

export async function load() {
  const authMethods = await pb.collection('users').listAuthMethods();
  return {
    authProviders: authMethods.authProviders
  };
}

export const ssr = false;
