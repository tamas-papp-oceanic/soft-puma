<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container3478 from './partials/Container3478.svelte';
  import { getname } from '../../config/devices.js';
  import { device } from '../../stores/data.js';
  import Notification from "../../components/Notification.svelte";

  export let params;

  const model = $location.split('/')[2];
  const timeout = 2000;
  let timer = null;
  let data = {
    instance: params.instance,
    banks: new Array(),
    autorun: false,
  }
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-digi-stat-data', (e, args) => {
      const [ dev, msg ] = args;
      if (msg.fields[0].value == data.instance) {
        for (let i = 0; i < 8; i++) {
          data.banks[i].status = msg.fields[i + 1].value;
          if (data.banks[i].status == 0) {
            data.banks[i].command = false;
          } else if (data.banks[i].status == 1) {
            data.banks[i].command = true;
          }
        }
      }
    });
  });

  onDestroy(() => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    running = false;
    window.pumaAPI.reml('n2k-digi-stat-data');
  });

  function stop(lis) {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    // Remove listeners
    window.pumaAPI.reml(lis + '-done');
  };

  function auto(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    data.autorun = true;
    // Receives program result
    window.pumaAPI.recv('a3478-done', (e, res) => {
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error writing channel data with this instance.';
        notify = true;
      }
      data.autorun = false;
      stop('a3478');
    });
    window.pumaAPI.send('a3478-write', [$device, parseInt(data.instance)]);
  };

  function change(e) {
    if (!data.autorun) {
      kind = null
      title = null;
      subttl = null;
      notify = false;
      running = true;
      timer = setTimeout(() => {
        kind = 'error'
        title = 'Error';
        subttl = 'Error writing channel data with this instance.';
        notify = true;
        stop('c3478');
        running = false;
      }, timeout);
      // Receives program result
      window.pumaAPI.recv('c3478-done', (e, res) => {
        if (!res) {
          kind = 'error'
          title = 'Error';
          subttl = 'Error writing channel data with this instance.';
          notify = true;
        }
        stop('c3478');
        running = false;
      });
      window.pumaAPI.send('c3478-write', [$device, parseInt(data.instance), parseInt(e.detail.cell) + 1, data.banks[e.detail.cell].command]);
    }
  };

  function cancel(e) {
    if (data.autorun) {
      window.pumaAPI.send('a3478-cancel');
    }
    data.autorun = false;
    running = false;
    stop('c3478');
    stop('a3478');
    pop();
  };
</script>

<Grid>
  <Row>
    <Column>
      <h2>{model + ' - ' + getname(model) + ' - Test'}</h2>
      <Container3478 bind:data={data} style="height: 80vh;" on:auto={auto} on:change={change} on:cancel={cancel} />
      {#if notify}
        <Notification kind={kind} title={title} subtitle={subttl} bind:notify={notify} />
      {/if}
    </Column>
  </Row>
</Grid>
