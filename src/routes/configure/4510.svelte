<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container4510 from './partials/Container4510.svelte';
  import { getfield } from '../../stores/common.js';
  import { device, findModel } from '../../stores/data';
  import { getname } from '../../config/devices.js';
  import Notification from "../../components/Notification.svelte";

  export let params;

  const model = $location.split('/')[2];
  const timeout = 2000;
  let rtimer = null;
  let wtimer = null;

  let data = {
    instance: params.instance,
    source: null,
    conf_type: null,
    temp_ins: null,
    temp_src: null,
    tx_pgn: null,
    isValid: false,
  };
  let save = JSON.parse(JSON.stringify(data));
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-egt-cfg-data', (e, args) => {
      const [ dev, msg ] = args;
      if (getfield(5, msg.fields).value == data.instance) {
        let prm = getfield(6, msg.fields);
        let fld = getfield(7, msg.fields);
        if ((prm != null) && (typeof prm.value != 'undefined') && (fld != null) && (typeof fld.value != 'undefined')) {
          let val = fld.value & 0xFF;
          switch (prm.value) {
            case 0:
              // Tx PGN type (0 = PGN130312 (deprecated), 1 = PGN130316, 2 = Both)
              data.tx_pgn = (fld.state == 'V') ? val.toString() : null;
              save.tx_pgn = data.tx_pgn;
              break;
            case 1:
              // Temperature source
              data.temp_src = (fld.state == 'V') ? val.toString() : null;
              save.temp_src = data.temp_src;
              break;
            case 2:
              // Temperature instance
              data.temp_ins = (fld.state == 'V') ? val.toString() : null;
              save.temp_ins = data.temp_ins;
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
    window.pumaAPI.reml('n2k-egt-cfg-data');
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
      subttl = 'Error reading configuration data with this instance.';
      notify = true;
    }, timeout);
    // Receives settings data
    data.isValid = false;
    window.pumaAPI.recv('r4510-done', (e, res) => {
      stop('r4510');
      running = false;
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading configuration data with this instance.';
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
    let chg = false;
    wtimer = setTimeout(() => {
      stop('w4510');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing configuration data with this instance.';
      notify = true;
    }, timeout);
    // Receives program result
    window.pumaAPI.recv('w4510-done', (e, res) => {
      stop('w4510');
      running = false;
      if (res) {
        if (chg) {
          select();
        }
        kind = 'info'
        title = 'Success';
        subttl = 'Configuration data has been sent.';
        notify = true;
      } else {
        kind = 'error'
        title = 'Error';
        subttl = 'Error writing configuration data with this instance.';
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
    val = parseInt(e.detail.temp_ins);
    if (val != save.temp_ins) {
      out.temp_ins = val;
    }
    val = parseInt(e.detail.temp_src);
    if (val != save.temp_src) {
      out.temp_src = val;
    }
    val = parseInt(e.detail.tx_pgn);
    if (val != save.tx_pgn) {
      out.tx_pgn = val;
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
      <Container4510 style="height: 80vh;" bind:data={data} running={running}
        on:select={select} on:program={program} on:cancel={cancel} on:error={error} />
      {#if notify}
        <Notification kind={kind} title={title} subtitle={subttl} bind:notify={notify} />
      {/if}
    </Column>
  </Row>
</Grid>
