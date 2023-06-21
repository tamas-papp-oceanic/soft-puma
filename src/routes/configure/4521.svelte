<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column, ToastNotification } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container4521 from './partials/Container4521.svelte';
  import { getname, getfield } from '../../stores/common.js';
  import { device, findModel } from '../../stores/data';

  export let params;

  const model = $location.split('/')[2];
  const timeout = 2000;
  let rtimer = null;
  let wtimer = null;

  let data = {
    instance: params.instance,
    source: null,
    conf_type: null,
    channels: new Array(),
    isValid: false,
  };
  for (let i = 0; i < 3; i++) {
    data.channels.push({
      enabled: false,
      temp_ins: null,
      temp_src: null,
      tx_pgn: null,
    });
  }

  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-temp-cfg-data', (e, args) => {
      const [ dev, msg ] = args;
      if (getfield(5, msg.fields).value == data.instance) {
        let fld = getfield(7, msg.fields);
        let chn = getfield(8, msg.fields);
        switch (getfield(6, msg.fields).value) {
          case 0:
            // Tx PGN type (0 = PGN130312 (deprecated), 1 = PGN130316, 2 = Both)
            data.channels[chn].tx_pgn = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
            break;
          case 1:
            // Temperature source
            data.channels[chn].temp_src = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
            break;
          case 2:
            // Temperature instance
            data.channels[chn].temp_ins = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
            break;
          case 3:
            // Channel enable
            data.channels[chn].enabled = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
            break;
          case 4:
            // Instance configuration type
            data.conf_type = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
            break;
        }
        data.isValid = true;
      }
    });
  });
  
  onDestroy(() => {
    window.pumaAPI.reml('n2k-temp-cfg-data');
  });

  function stop(lis) {
    if (lis == 'r4510') {
      if (rtimer != null) {
        clearTimeout(rtimer);
        rtimer = null;
      }
    } else if (lis == 'w4510') {
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
      stop('r4510');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error reading settings data with this instance.';
      notify = true;
    }, timeout);
    // Receives settings data
    data.conf_type = null;
    data.channels = new Array();
    for (let i = 0; i < 3; i++) {
      data.channels.push({
        enabled: false,
        temp_ins: null,
        temp_src: null,
        tx_pgn: null,
      });
    }
    data.isValid = false;
    window.pumaAPI.recv('r4510-done', (e, res) => {
      stop('r4510');
      running = false;
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading settings data with this instance.';
        notify = true;
      }
    });
    window.pumaAPI.send('c4510-read', [$device, parseInt(data.instance)]);
  };

  function program(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    wtimer = setTimeout(() => {
      stop('w4510');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing parameter with this instance.';
      notify = true;
    }, timeout);
    // Receives program result
    window.pumaAPI.recv('w4510-done', (e, res) => {
      stop('w4510');
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
    let out = {
      conf_type: e.detail.conf_type,
      channels: new Array(),
    }
    for (let i = 0; i < 3; i++) {
      out.channels[i].push({
        enabled: parseInt(e.detail.channels[i].enabled),
        temp_ins: parseInt(e.detail.channels[i].temp_ins),
        temp_src: parseInt(e.detail.channels[i].temp_src),
        tx_pgn: parseInt(e.detail.channels[i].tx_pgn),
      });
    }
    window.pumaAPI.send('c4510-write', [$device, parseInt(data.instance), out]);
  };

  function cancel(e) {
    stop('r4510');
    stop('w4510');
    running = false;
    pop();
  };

  function error(e) {
    kind = 'error'
    title = 'Error';
    subttl = e.detail.title;
    notify = true;
  }

  function setData(val) {
    if (val != null) {
      data.instance = val.instance;
      data.source = null;
      let pro = findModel(model);
      if ((pro !== null) && (Array.isArray(pro)) && (pro.length > 0)) {
        for (let i in pro) {
          if (pro[i].name.deviceInstance == val.instance) {
            data.source = pro[0].address;
            break;
          }
        }
      }
      select();
    }
  };

  $: params, setData(params);
</script>

<Grid>
  <Row>
    <Column>
      <h2>{model + ' - ' + getname(model) + ' - Configuration'}</h2>
      <Container4521 style="height: 80vh;" bind:data={data} running={running}
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