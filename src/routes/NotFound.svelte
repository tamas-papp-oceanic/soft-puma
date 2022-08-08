<script>
  import { pop } from 'svelte-spa-router'
</script>

<main>
	Something went wrong. <a href={'#'} on:click={(e) => pop(e)}>Go back.</a>
</main>
