import PocketBase from 'pocketbase';
import { redirect } from "@sveltejs/kit";

const pb = new PocketBase('https://db.guymon.family');

export async function load() {
  const authData = await pb.collection('users').authRefresh().then((data) => {
    return data;
  }).catch(() => {
    redirect(303, '/auth');
  });
  return { authStore: pb.authStore };
}

export const ssr = false;
