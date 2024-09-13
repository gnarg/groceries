<script>
  // @ts-nocheck
	import Item from "./Item.svelte";
  import { listItems, createItem } from '$lib/pocketbase';

  let purchased = false;
  let filter_tag = null;
  let search = null;

  $: items = listItems(purchased, filter_tag, search);

  let new_item = { name: '', tags: '', purchased: false };
  let addNewItem = async () => {
    const item = await createItem(new_item);
    new_item = { name: '', tags: '', purchased: false };
    items = listItems(purchased, filter_tag, search);
  }
</script>

<div class="mx-auto w-11/12 max-w-3xl">
  <h2 class="text-2xl text-gray-900 flex py-2">
    <img src="/icon.png" class="object-scale-down w-8 h-8" alt="grocery bag" />
    Shopping List
  </h2>

  <div class="flex items-stretch flex-grow px-4 py-2">
    <input id="search" type="text" name="search" class="block w-full rounded-none rounded-l-md sm:text-sm border-gray-300" placeholder="Search" bind:value={search} />
    <button on:click={() => search = null}>
      <span class="sr-only">Clear</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mx-2 my-2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  </div>

  <div id="items-container" class="block max-w-full w-full bg-gray-100 py-4 px-4 border border-gray-200 rounded shadow-sm">
    <div class="border-b border-gray-200 w-full">
      {#if filter_tag}
      <div class="px-1 mx-4 text-white bg-gray-400 rounded w-min">
        <button on:click={() => filter_tag = null}>{filter_tag}</button>
      </div>
      {/if}

      <ul class="flex space-x-2 justify-center">
        <li>
          <button on:click={() => purchased = false} class="inline-block py-4 px-4 text-lg font-medium text-center text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300">Need</button>
        </li>
        <li>
          <button on:click={() => purchased = true} class="inline-block py-4 px-4 text-lg font-medium text-center text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300">Bought</button>
        </li>
      </ul>
    </div>

    <ul id="items">
      {#await items}
        <li>&nbsp;</li>
      {:then items} 
        {#each items as item}
          <Item {item} bind:filter_tag />
        {/each}
      {/await}
    </ul>

    <div class="py-2 px-4">
      <label for="name" class="sr-only" />
      <input type="text" name="name" class="block w-full rounded-none sm:text-sm border-gray-300" placeholder="Item name..." bind:value={new_item.name} />
      <div class="flex item-stretch flex-grow">
        <label for="tag_list" class="sr-only" />
        <input type="text" name="tag_list" class="block w-full rounded-none sm:text-sm border-gray-300" placeholder="Tags..." bind:value={new_item.tags} />
        <button type="submit"  class="-ml-px relative px-4 py-2 border border-blue-600 text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700" on:click={() => addNewItem() }>
          Add
        </button>
      </div>
    </div>
  </div>
</div>
