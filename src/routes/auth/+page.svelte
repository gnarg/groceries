<script lang="ts">
  import PocketBase, { type AuthProviderInfo } from 'pocketbase';
  import { authState } from '$lib/authState';

  export let data: { authProviders: AuthProviderInfo[] };

  const pb = new PocketBase('https://db.guymon.family');
  const redirectUrl = window.location.origin + '/auth/redirect';

  const provider = data.authProviders.find((provider) => provider.name === 'google');
  authState.set(JSON.stringify(provider));

  window.location.href = provider?.authUrl + redirectUrl
</script>
