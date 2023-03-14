<script>
  import Router from 'svelte-spa-router';
	import { push } from 'svelte-spa-router'
	import { wrap } from 'svelte-spa-router/wrap';
	import { ComposedModal, ModalHeader, ModalBody, ModalFooter,
		ProgressBar } from 'carbon-components-svelte';
	import Login from './routes/Login.svelte';
	import Welcome from './routes/Welcome.svelte';
	import NotFound from './routes/NotFound.svelte';
	import Header from './components/Header.svelte';
	import Devices from './routes/devices/Index.svelte';
	import Monitor from './routes/devices/Monitor.svelte';
	import Content from './routes/devices/Content.svelte';
	// import Details from './routes/Details.svelte';
	import Configure from './routes/configure/Index.svelte';
	import Configure3420 from './routes/configure/3420.svelte';
	import ConfigureFluid from './routes/configure/fluid.svelte';
	import Program from './routes/program/Index.svelte';
	import Program3420 from './routes/program/3420.svelte';
	import Testing from './routes/testing/Index.svelte';
	import Test3478 from './routes/testing/3478.svelte';
	import Test4410 from './routes/testing/4410.svelte';
	import Test5185 from './routes/testing/5185.svelte';
	import { loggedIn } from './stores/user.js';
  import { update, updmsg, download, progress } from './stores/update.js';
	import { allRoutes, updates } from './stores/data.js';
  import { compareVersions } from 'compare-versions';

	export let version;
	export let appName;

  const routes = {
		"/": Devices,
		"/login": wrap({
			component: Login,
			conditions: [() =>{
				if ($loggedIn == true) {
					push("/welcome")
				} else {
					return true
				}
			}],
		}),
		"/configure": Configure,
		"/configure/3271/:instance/:fluid": ConfigureFluid,
		"/configure/3281/:instance/:fluid": ConfigureFluid,
		"/configure/3420/:instance": Configure3420,
		"/configure/3125/:instance/:fluid": ConfigureFluid,
		"/configure/4291/:instance/:fluid": ConfigureFluid,
		"/program": Program,
		"/program/3420/:instance": Program3420,
		"/testing": Testing,
    "/testing/3478/:instance": Test3478,
		"/testing/4410/:instance": Test4410,
		"/testing/5185": Test5185,
    "/testing/5185-H": Test5185,
		"/Welcome": wrap({
			component: Welcome,
			conditions: [() =>{
				if ($loggedIn == true) {
					return true
				} else {
					push("/login")
				}
			}],
		}),
		"/monitor/:address": Monitor,
		"/messages/:protocol/:pgn/:function/:manufacturer/:industry/:instance/:type": Content,
		// "/details/:protocol/:pgn/:function/:manufacturer/:industry/:instance/:type": Details,
		"*": NotFound,
	};

	let prc;
  let val;
	let max;
	let txt;
	let started = false;

	// Updater available hook
  window.pumaAPI.recv('upd-available', (e, val) => {
    $update = true;
    $updmsg = val;
  });

	// Updater download hook
  window.pumaAPI.recv('upd-download', (e, val) => {
		$download = val;
  });

	// Updater progress hook
  window.pumaAPI.recv('upd-progress', (e, val) => {
    // {
		//   total: 103826908,
		//   delta: 2132100,
		//   transferred: 6227698,
		//   percent: 5.99815415865028,
		//   bytesPerSecond: 2075899
		// }
		$progress = val;
  });

	// Updates download hook
  window.pumaAPI.recv('updates', (e, val) => {
    let res = JSON.parse(JSON.stringify(val));
    for (const [key1, val1] of Object.entries(res)) {
      for (const [key2, val2] of Object.entries(val1)) {
        val2.sort((a, b) => {
          return -compareVersions(a.version, b.version);
        })
      }
    }
    $updates = JSON.parse(JSON.stringify(res));
  });

  function _start(e) {
		started = true;
		window.pumaAPI.send('upd-start');
	}

	function _cancel(e) {
		window.pumaAPI.send('upd-cancel');
		$download = false;
		$progress = {};
		started = false;
	}

  $allRoutes = new Array();
  for (const [key, val] of Object.entries(routes)) {
    if (key.startsWith('/configure/') || key.startsWith('/program/') || key.startsWith('/testing/')) {
      $allRoutes.push(key);
    }
  }

	$: prc = $progress && $progress.percent ? $progress.percent : 0;
	$: max = $progress && $progress.total ? $progress.total / (1024 * 1024) : 100;
	$: val = $progress && $progress.transferred ? $progress.transferred / (1024 * 1024) : 0;
	$: txt = val > 0 ? val.toFixed(0) + "MB of " + max.toFixed(0) + "MB" : "Press start";
  $: if (val === max) { txt = "Done" };
</script>

<svelte:head>
	<title>{appName} [v{version}]</title>
</svelte:head>

<Header company="Oceanic" product={appName} version={version} />
<main class="content">
	<Router {routes} restoreScrollState={true} />
	<ComposedModal bind:open={$download} on:submit={(e) => _start(e)}>
		<ModalHeader label="Download update" title={"Confirm download of Puma v" + $updmsg} />
		<ModalBody>
			<ProgressBar value={prc} labelText="Download status" helperText={txt} />
		</ModalBody>
		<ModalFooter
			primaryButtonDisabled={started == true}
			primaryButtonText="Start"
			secondaryButtons={[{ text: "Cancel" }]}
			on:click:button--secondary={(e) => _cancel(e)}
		/>
	</ComposedModal>
</main>

<style lang="scss" global>
	@import "~carbon-components-svelte/css/g100.css";
	.content {
		margin-top: 10vh;
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
