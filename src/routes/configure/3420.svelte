<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column, ToastNotification } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container3420 from './partials/Container3420.svelte';
  import { getname } from '../../stores/common.js';

  export let params;

  const plf = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';

  const device = $location.split('/')[2];
  const timeout = 2000;
  let timer = null;
  let data = {
    instance: params.instance,
    circuit: null,
  };
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-acconf', (e, args) => {
      const [ dev, msg ] = args;
      if (msg.fields[4].value == data.instance) {
        switch (msg.fields[5].value) {
          case 0:
            // Circuit Type (1 = Single Phase, 2 = Duble Phase, 3 = Three Phase, 4 = Split Phase)
            data.circuit = msg.fields[6].value.toString();
            stop('c3420');
            running = false;
            break;
          case 1:
            // Device Instance
            data.instance = msg.fields[6].value.toString();
            stop('c3420');
            running = false;
            break;
        }
      }
    });
    select();
  });
  
  onDestroy(() => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    running = false;
    window.pumaAPI.reml('n2k-3420');
  });

  function stop(lis) {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    // Remove listeners
    window.pumaAPI.reml(lis + '-done');
  };

   function select(e) {
    running = true;
    timer = setTimeout(() => {
      kind = 'error'
      title = 'Error';
      subttl = 'Error reading circuit type with this instance.';
      notify = true;
      running = false;
    }, timeout);
    data.circuit = null;
    // Receives circuit type result
    window.pumaAPI.recv('c3420-done', (e, res) => {
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading circuit with this instance.';
        notify = true;
        stop('c3420');
        running = false;
      }
    });
    window.pumaAPI.send('c3420-read', [parseInt(data.instance), 0x00]);
  };

  function program(e) {
    running = true;
    timer = setTimeout(() => {
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing parameter with this instance.';
      notify = true;
      stop('c3420');
      running = false;
    }, timeout);
    // Receives program result
    window.pumaAPI.recv('c3420-done', (e, res) => {
      if (res) {
        kind = 'info'
        title = 'Success';
        subttl = 'Parameter has been sent.';
        notify = true;
      } else {
        kind = 'error'
        title = 'Error';
        subttl = 'Error writing parameter with this instance.';
        notify = true;
      }
      stop('c3420');
      running = false;
    });
    let conf = e.detail.parameter == '0' ? parseInt(e.detail.instance) : parseInt(e.detail.circuit);
    window.pumaAPI.send('c3420-write', [parseInt(data.instance), conf]);
  };

  function cancel(e) {
    stop('c3420');
    running = false;
    pop();
  };

  function error(e) {
    kind = 'error'
    title = 'Error';
    subttl = e.detail.title;
    notify = true;
  }
</script>

<Grid>
  <Row>
    <Column>
      <h2>{device + ' ' + getname(device) + ' - Configuration'}</h2>
      <Container3420 style="height: 80vh;" bind:data={data} running={running}
        on:select={select} on:program={program} on:cancel={cancel} on:error={error} />
      {#if notify}
        <div class="error">
          <ToastNotification
            kind={kind}
            title={title}
            subtitle={subttl}
            caption={new Date().toLocaleString()}
            on:close={(e) => (notify = false)}
          />
        </div>
      {/if}
    </Column>
  </Row>
</Grid>

<style lang="css">
.error {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
}
</style>