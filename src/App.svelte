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
	import Simulate from './routes/Simulate.svelte';
	import Configure from './routes/Configure.svelte';
	import Program from './routes/program/Index.svelte';
	import Program3420 from './routes/program/3420.svelte';
	import Program5185 from './routes/program/5185.svelte';
	import ProgramFuel from './routes/program/fuel.svelte';
	import { loggedIn } from './stores/user.js';
  import { update, updmsg, download, progress } from './stores/update.js';

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
		"/simulate": Simulate,
		"/program": Program,
		"/program/3420": Program3420,
		"/program/fuel/:adaptor?": ProgramFuel,
		"/program/5185/:variant?": Program5185,
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
		"/devices/:address": Configure,
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

	window.pumaAPI.send('dev-start');

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
