<script>
  import Router from 'svelte-spa-router';
	import {location, push, pop, replace, link} from 'svelte-spa-router'
	import { wrap } from 'svelte-spa-router/wrap';
	import Login from './routes/Login.svelte';
	import Logout from './routes/Logout.svelte';
	import Welcome from './routes/Welcome.svelte';
	import NotFound from './routes/NotFound.svelte';
	import Header from './components/Header.svelte';
	import Devices from './routes/devices/Index.svelte';
	import Monitor from './routes/Monitor.svelte';
	import Simulate from './routes/Simulate.svelte';
	import Configure from './routes/Configure.svelte';
	import Program from './routes/program/Index.svelte';
	import Program5185 from './routes/program/5185.svelte';
	import { loggedIn } from './stores/user.js';

	export let version;
	export let appName;

  const routes = {
		"/": Devices,
		"/login": wrap({
			component: Login,
			conditions: [(detail) =>{
				if($loggedIn == true) {
					push("/welcome")
				} else {
					return true
				}
			}],
		}),
		"/logout": wrap({
			component: Logout,
			conditions: [(detail) =>{
				if($loggedIn == false) {
					push("/login")
				} else {
					return true
				}
			}],
		}),
		"/simulate": Simulate,
		"/program": Program,
		"/program/5185": Program5185,
		"/Welcome": wrap({
			component: Welcome,
			conditions: [(detail) =>{
				if($loggedIn == true) {
					return true
				} else {
					push("/login")
				}
			}],
		}),
		"/devices/:address": Configure,
		"/monitor/:address": Monitor,
		"*": NotFound,
	};
</script>

<style lang="scss" global>
	@import "~carbon-components-svelte/css/g100.css";

	.content {
		margin-top: 10vh;
		overflow-x: hidden;
		height: 87vh;
	}

	@media (min-width: 48rem) {
		.bx--header__nav {
			display: block;
		}
	}

	html {
		height: 100%;
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
