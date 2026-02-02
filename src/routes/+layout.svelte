<svelte:head>
  <title>Groceries</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="application-name" content="Groceries" />
  <meta name="apple-mobile-web-app-title" content="Groceries" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black" />
  <link rel="apple-touch-icon" href="/icon.png" />
</svelte:head>

<script>
  import "../app.css";
</script>


<main class="container mx-auto mt-6 flex">
  <slot />
</main>
