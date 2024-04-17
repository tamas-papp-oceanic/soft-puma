<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { pop } from "svelte-spa-router";
  import SerialContainer from './partials/SerialContainer.svelte';
  import Notification from "../../components/Notification.svelte";
  import { device, name } from '../../stores/data.js';

  export const params = {};

  const timeout = 5000;
  let timer = null;
  let kind = null
  let title = null;
  let subttl = null;
  let notify = false;
  let running = false;
  let data = {};

  onMount(() => {
    data.name = {};
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
    window.pumaAPI.reml(lis + '-done');
  }

  function getproduct(e) {
    data.name = {};
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    timer = setTimeout(() => {
      if (Object.keys($name[$device]).length > 1) {
        kind = 'error'
        title = 'Error';
        subttl = 'More than one device found.';
        notify = true;
      } else {
        data.name = JSON.parse(JSON.stringify(Object.values($name[$device])[0])); 
      }
      running = false;
    }, 500);
    window.pumaAPI.send('bus-scan');
  };

  function setserial(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    timer = setTimeout(() => {
      kind = 'error'
      title = 'Error';
      subttl = 'Error setting serial number.';
      notify = true;
      stop('ser');
      running = false;
    }, timeout);
    // Receives serial number setting result
    window.pumaAPI.recv('ser-done', (e, res) => {
      stop('ser');
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error setting serial number.';
        notify = true;
        running = false;
      } else {
        getproduct();
      }
    });
    window.pumaAPI.send('ser-write', [$device, data.serial]);
  };

  function cancel(e) {
    stop('ser');
    running = false;
    pop();
  };
</script>

<Grid>
  <Row>
    <Column>
      <h2>Set Serial Number</h2>
      <SerialContainer data={data} running={running} style="height: 80vh;"
      on:getproduct={getproduct} on:setserial={setserial} on:cancel={cancel} />
      {#if notify}
        <Notification kind={kind} title={title} subtitle={subttl} bind:notify={notify} />
      {/if}
    </Column>
  </Row>
</Grid>
