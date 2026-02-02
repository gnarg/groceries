<script lang="ts">
	import { goto } from '$app/navigation';
  import PocketBase from 'pocketbase';
  import { authState } from '$lib/authState';

  const pb = new PocketBase('https://db.guymon.family');
  const redirectUrl = window.location.origin + '/auth/redirect';

  const params = (new URL(window.location.href)).searchParams;
  const provider = JSON.parse($authState || '{}');
  if (provider.state !== params.get('state')) {
    console.log(provider.state, params.get('state'));
    throw "State parameters don't match.";
  }

  let error = '';
  pb.collection('users').authWithOAuth2Code(
      provider.name,
      params.get('code') || '',
      provider.codeVerifier,
      redirectUrl,
      { emailVisibility: false, nameVisibility: false }
  ).then(() => {
      goto('/');
  }).catch((err) => {
      error = "Failed to exchange code.\n" + err;
  });
</script>

<div>{error}</div>
