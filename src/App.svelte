<script>
	export let version;
	export let appName;
	import Router from "svelte-spa-router";
	import Login from './routes/Login.svelte';
	import NotFound from './routes/NotFound.svelte';
	import Header from './components/Header.svelte';
	const routes = {
	  "/": Login,
	  "*": NotFound,
	};

</script>

<style lang="scss" global>
  @import "~carbon-components-svelte/css/g100.css";
	.content {
		margin-top: 4rem;
	}
</style>


<svelte:head>
	<title>{appName} [v{version}]</title>
</svelte:head>

<Header company="Oceanic" product={appName} version={version}/>
<main class="content">
	<Router {routes} restoreScrollState={true} />
</main>
