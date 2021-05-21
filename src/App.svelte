<script>
	export let version;
	export let appName;
	import Router from "svelte-spa-router";
	import Login from './routes/Login.svelte';
	import NotFound from './routes/NotFound.svelte';
	import Header from './components/Header.svelte';
	import Devices from './routes/devices/Index.svelte';
	import Simulate from './routes/Simulate.svelte';
	import Configure from './routes/Configure.svelte';
	const routes = {
		"/": Devices,
		"/login": Login,
		"/simulate": Simulate,
		"/program": Login,
		"/devices/:address" : Configure,
		"*": NotFound,
	};
</script>

<style lang="scss" global>
	@import "~carbon-components-svelte/css/g100.css";

	.content {
		margin-top: 4rem;
		overflow-x: hidden;
		height: 100%;
	}

	@media (min-width: 48rem) {
		.bx--header__nav {
			display: block;
		}
	}
	html {
		height:100%;
	}
	body {
		height: 100%;
		overflow-y: hidden;
	}
</style>


<svelte:head>
	<title>{appName} [v{version}]</title>
</svelte:head>

<Header company="Oceanic" product={appName} version={version} />
<main class="content">
	<Router {routes} restoreScrollState={true} />
</main>
