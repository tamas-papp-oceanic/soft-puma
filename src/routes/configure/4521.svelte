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
    tx_pgn: null,
    channels: new Array(),
    isValid: false,
  };
  for (let i = 0; i < 4; i++) {
    data.channels.push({
      enabled: null,
      temp_ins: null,
      temp_src: null,
    });
  }
  let save = JSON.parse(JSON.stringify(data));
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-temp-cfg-data', (e, args) => {
      const [ dev, msg ] = args;
      if (getfield(5, msg.fields).value == data.instance) {
        let prm = getfield(6, msg.fields);
        let fld = getfield(7, msg.fields);
        if ((prm != null) && (typeof prm.value != 'undefined') && (fld != null) && (typeof fld.value != 'undefined')) {
          let val = fld.value & 0xFF;
          let chn = (fld.value >> 8) & 0xFF;
          switch (prm.value) {
            case 0:
              // Tx PGN type (1 = PGN130312 (deprecated), 2 = PGN130316, 3 = Both)
              data.tx_pgn = (fld.state == 'V') ? val.toString() : null;
              save.tx_pgn = data.tx_pgn;
              break;
            case 1:
              // Temperature source
              data.channels[chn].temp_src = (fld.state == 'V') ? val.toString() : null;
              save.channels[chn].temp_src = data.channels[chn].temp_src;
              break;
            case 2:
              // Temperature instance
              data.channels[chn].temp_ins = (fld.state == 'V') ? val.toString() : null;
              save.channels[chn].temp_ins = data.channels[chn].temp_ins;
              break;
            case 3:
              // Channel enable
              data.channels[chn].enabled = (fld.state == 'V') ? val.toString() : null;
              save.channels[chn].enabled = data.channels[chn].enabled;
              break;
            case 4:
              // Instance configuration type
              data.conf_type = (fld.state == 'V') ? val.toString() : null;
              save.conf_type = data.conf_type;
              break;
          }
          data.isValid = true;
        }
      }
    });
  });
  
  onDestroy(() => {
    window.pumaAPI.reml('n2k-temp-cfg-data');
  });

  function stop(lis) {
    if (lis == 'r4521') {
      if (rtimer != null) {
        clearTimeout(rtimer);
        rtimer = null;
      }
    } else if (lis == 'w4521') {
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
      stop('r4521');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error reading settings data with this instance.';
      notify = true;
    }, timeout);
    // Receives settings data
    data.isValid = false;
    window.pumaAPI.recv('r4521-done', (e, res) => {
      stop('r4521');
      running = false;
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading settings data with this instance.';
        notify = true;
      }
    });
    window.pumaAPI.send('c4521-read', [$device, parseInt(data.instance)]);
  };

  function program(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    let chg = false;
    wtimer = setTimeout(() => {
      stop('w4521');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing parameter with this instance.';
      notify = true;
    }, timeout);
    // Receives program result
    window.pumaAPI.recv('w4521-done', (e, res) => {
      stop('w4521');
      running = false;
      if (res) {
        if (chg) {
          select();
        }
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
    let out = {};
    let val = parseInt(e.detail.conf_type);
    if (val != save.conf_type) {
      out.conf_type = val;
      if (val == 0) {
        chg = true;
      }
    }
    val = parseInt(e.detail.tx_pgn);
    if (val != save.tx_pgn) {
      out.tx_pgn = val;
    }
    out.channels = [{}, {}, {}, {}];
    for (let i = 0; i < 4; i++) {
      val = parseInt(e.detail.channels[i].enabled);
      if (val != save.channels[i].enabled) {
        out.channels[i].enabled = val;
      }
      val = parseInt(e.detail.channels[i].temp_ins);
      if (val != save.channels[i].temp_ins) {
        out.channels[i].temp_ins = val;
      }
      val = parseInt(e.detail.channels[i].temp_src);
      if (val != save.channels[i].temp_src) {
        out.channels[i].temp_src = val;
      }
    }
    window.pumaAPI.send('c4521-write', [$device, parseInt(data.instance), out]);
  };

  function cancel(e) {
    stop('r4521');
    stop('w4521');
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