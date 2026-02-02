import PocketBase from 'pocketbase';
import { redirect } from "@sveltejs/kit";

const pb = new PocketBase('https://db.guymon.family');

export async function load() {
  await pb.collection('users').authRefresh().catch(() => redirect(303, '/auth') );
  if (!pb.authStore.isValid) redirect(303, '/auth');
}

export const ssr = false;
