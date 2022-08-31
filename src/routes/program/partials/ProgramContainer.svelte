<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { ButtonSet, Button, Tile } from "carbon-components-svelte";
  import { checkAccess } from "../../../auth/auth.js";

  export let device;
  export let style;

  const plf = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
  const dispatch = createEventDispatcher();
  const timeout = 5000;
  let running = false;
  let access = false;
  let message = '';
  let timer = null;

  onMount(() => {
    switch (plf) {
      case 'Win32':
        break;
      default:
        break;
    }
  });

  function stop(lis) {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    // Remove listeners
    window.pumaAPI.reml(lis + '-data');
    window.pumaAPI.reml(lis + '-done');
  }

  function loader(e) {
    running = true;
    timer = setTimeout(() => {
      stop('boot');
      running = false;
    }, timeout);
    message = '';
    // Receives bootloader data
    window.pumaAPI.recv('boot-data', (e, msg) => {
      message += msg;
    });
    // Receives bootloader result
    window.pumaAPI.recv('boot-done', (e, res) => {

console.log(res);

      stop('boot');
      running = false;
    });
    window.pumaAPI.send('boot-start', device);
  };

  function program(e) {
    running = true;
    timer = setTimeout(() => {
      stop('prog');
      running = false;
    }, timeout);
    message = '';
    // Receives programming data
    window.pumaAPI.recv('prog-data', (e, msg) => {
      message += msg;
    });
    // Receives programming result
    window.pumaAPI.recv('prog-done', (e, res) => {

console.log(res);

      stop('prog');
      running = false;
    });
    window.pumaAPI.send('prog-start', device);
  };

  function cancel(e) {
    stop('boot-done');
    stop('prog-done');
    running = false;
    dispatch("cancel", e);
  };

  // Data getters
  $: access = checkAccess('boot', 'write');
</script>

<div class="container" style={style}>
  <Tile style="height: -webkit-fill-available;">
    <div class="tilecont">
      <div class="title">Connect the device to CAN network and press a button below.</div>
      <div class="buttons">
        {#if access}
          <Button kind="primary" disabled={running} on:click={(e) => loader(e)}>Boot loader</Button>
        {/if}
        <Button kind="primary" disabled={running} on:click={(e) => program(e)}>Program</Button>
      </div>
      <h5>Console</h5>
      <div class="console">
        <Tile style="height: -webkit-fill-available;">{message}</Tile>
      </div>
    </div>
  </Tile>
  <ButtonSet style="justify-content: flex-end;">
    <Button kind="secondary" on:click={(e) => cancel(e)}>Cancel</Button>
  </ButtonSet>
</div>

<style>
  .container {
    display: flex;
    flex-flow: column nowrap;
    justify-content: stretch;
    border: 1px solid gray;
    width: 100%;
  }
  .container .tilecont {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    height: 100%;
  }
  .container .tilecont .title {
    max-width: 90%;
    white-space: pre-line;
    font-size: 1.25rem;
    text-align: justify;
    margin-bottom: 2rem;
  }
  .container .tilecont .buttons {
    width: 100%;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-around;
    margin-bottom: 1rem;
  }
  .container .tilecont .console {
    width: 100%;
    flex: 1 auto;
    border: 1px solid gray;
    overflow-y: auto;
  }
</style>
