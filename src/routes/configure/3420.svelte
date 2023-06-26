<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column, ToastNotification } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container3420 from './partials/Container3420.svelte';
  import { device } from '../../stores/data';
  import { getname } from '../../config/devices.js';

  export let params;

  const model = $location.split('/')[2];
  const timeout = 2000;
  let rtimer = null;
  let wtimer = null;
  let data = {
    instance: params.instance,
    source: null,
    circuit: null,
    isValid: false,
  };
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-ac-data', (e, args) => {
      const [ dev, msg ] = args;
      if (getfield(5, msg.fields).value == data.instance) {
        let fld = getfield(7, msg.fields);
        switch (getfield(6, msg.fields).value) {
          case 0:
            // Circuit Type (1 = Single Phase, 2 = Double Phase, 3 = Three Phase, 4 = Split Phase)
            data.circuit = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
            break;
          case 1:
            // Device Instance
            data.instance = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
            break;
        }
        data.isValid = true;
      }
    });
  });
  
  onDestroy(() => {
    window.pumaAPI.reml('n2k-ac-cfg-data');
  });

  function stop(lis) {
    if (lis == 'r3420') {
      if (rtimer != null) {
        clearTimeout(rtimer);
        rtimer = null;
      }
    } else if (lis == 'w3420') {
      if (wtimer != null) {
        clearTimeout(wtimer);
        wtimer = null;
      }
    }
    // Remove listeners
    window.pumaAPI.reml(lis + '-done');
  };

  function select(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    rtimer = setTimeout(() => {
      stop('r3420');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error reading circuit type with this instance.';
      notify = true;
    }, timeout);
    data.circuit = null;
    data.isValid = false;
    // Receives circuit type result
    window.pumaAPI.recv('r3420-done', (e, res) => {
      stop('r3420');
      running = false;
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading circuit type with this instance.';
        notify = true;
      }
    });
    window.pumaAPI.send('c3420-read', [$device, parseInt(data.instance)]);
  };

  function program(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    wtimer = setTimeout(() => {
      stop('w3420');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing parameter with this instance.';
      notify = true;
    }, timeout);
    // Receives program result
    window.pumaAPI.recv('w3420-done', (e, res) => {
      stop('w3420');
      running = false;
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
    });
    window.pumaAPI.send('c3420-write', [$device, parseInt(data.instance), parseInt(e.detail.instance), parseInt(e.detail.circuit)]);
  };

  function cancel(e) {
    stop('r3420');
    stop('w3420');
    running = false;
    pop();
  };

  function error(e) {
    kind = 'error'
    title = 'Error';
    subttl = e.detail.title;
    notify = true;
  }

  select();
</script>

<Grid>
  <Row>
    <Column>
      <h2>{model + ' - ' + getname(model) + ' - Configuration'}</h2>
      <Container3420 style="height: 80vh;" bind:data={data} running={running}
        on:select={select} on:program={program} on:cancel={cancel} on:error={error} />
      {#if notify}
        <div class="error">
          <ToastNotification kind={kind} title={title} subtitle={subttl} caption={new Date().toLocaleString()}
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