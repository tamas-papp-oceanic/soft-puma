<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import ProgramContainer from './partials/ProgramContainer.svelte';
  import { getname } from '../../stores/common.js';
  import { device } from '../../stores/data.js';

  export let params;

  const plf = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
  
  const model = $location.split('/')[2];
  const iface = $device;
  const instance = params.instance;
  const timeout = 5000;
  let timer = null;
  let message = '';
  let running = false;

  onMount(() => {
  });
  
  onDestroy(() => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    running = false;
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
      stop('boot');
      running = false;
    });
    window.pumaAPI.send('boot-start', model);
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
      stop('prog');
      running = false;
    });
    window.pumaAPI.send('prog-start', [iface, model, instance]);
  };

  function cancel(e) {
    stop('boot');
    stop('prog');
    running = false;
    pop();
  };
</script>

<Grid>
  <Row>
    <Column>
      <h2>{model + ' ' + getname(model) + ' - Programming'}</h2>
      <ProgramContainer message={message} running={running} style="height: 80vh;"
        on:loader={loader} on:program={program} on:cancel={cancel} />
    </Column>
  </Row>
</Grid>

<style lang="css">
</style>