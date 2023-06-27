<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { pop } from "svelte-spa-router";
  import ProgramContainer from './partials/ProgramContainer.svelte';
  import { getname } from '../../config/devices.js';
  import { device, getUpdate } from '../../stores/data.js';
  import { getid } from '../../config/devices.js';

  export let params;

  const model = params.device;
  const instance = params.instance;
  const timeout = 60000;
  let timer = null;
  let message = '';
  let running = false;
  let data = {
    instance: params.instance,
  }

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
    let upd = getUpdate(model);
    if ((typeof upd['boot'] !== "undefined") && (typeof upd['boot']['location'] !== "undefined")) {
      window.pumaAPI.send('boot-start', upd['boot']['location']);
    }
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
    let dtype =getid(model);
    let upd = getUpdate(model);
    if ((typeof upd['main'] !== "undefined") && (typeof upd['main']['location'] !== "undefined")) {
      window.pumaAPI.send('prog-start', [$device, upd['main']['location'], dtype, instance]);
    }
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
      <h2>{model + ' - ' + getname(model) + ' - Update'}</h2>
      <ProgramContainer model={model} bind:data={data} message={message} running={running} style="height: 80vh;"
        on:loader={loader} on:program={program} on:cancel={cancel} />
    </Column>
  </Row>
</Grid>
