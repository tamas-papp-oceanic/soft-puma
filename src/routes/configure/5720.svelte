<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container5720 from './partials/Container5720.svelte';
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
    mod_ins: '0',
    eng_flo_ins: '0',
    eng_ret_ins: '0',
    temp_flo_ins: '0',
    temp_ret_ins: '0',
    op_mode: '0',
    kfact_flo: null,
    kfact_ret: null,
    total_flo: null,
    total_ret: null,
    isValid: false,
  };
  let save = JSON.parse(JSON.stringify(data));
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-flow-s-cfg-data', (e, args) => {
      const [ dev, msg ] = args;
      if (getfield(5, msg.fields).value == data.instance) {
        let prm = getfield(6, msg.fields);
        let fld = getfield(7, msg.fields);
        if ((prm != null) && (typeof prm.value != 'undefined') && (fld != null) && (typeof fld.value != 'undefined')) {
          let val = fld.value & 0xFF;
          switch (prm.value) {
            case 0:
              // Module instance
              data.mod_ins = (fld.state == 'V') ? val.toString() : null;
              save.mod_ins = data.mod_ins;
              break;
            case 1:
              // Engine flow instance
              data.eng_flo_ins = (fld.state == 'V') ? val.toString() : null;
              save.eng_flo_ins = data.eng_flo_ins;
              break;
            case 2:
              // Engine return instance
              data.eng_ret_ins = (fld.state == 'V') ? val.toString() : null;
              save.eng_ret_ins = data.eng_ret_ins;
              break;
            case 3:
              // Temperature flow instance
              data.temp_flo_ins = (fld.state == 'V') ? val.toString() : null;
              save.temp_flo_ins = data.temp_flo_ins;
              break;
            case 4:
              // Temperature return instance
              data.temp_ret_ins = (fld.state == 'V') ? val.toString() : null;
              save.temp_ret_ins = data.temp_ret_ins;
              break;
            case 5:
              // Operating mode
              data.op_mode = (fld.state == 'V') ? val.toString() : null;
              save.op_mode = data.op_mode;
              break;
          }
        }
      }
    });
    window.pumaAPI.recv('n2k-flow-f-cfg-data', (e, args) => {
      const [ dev, msg ] = args;
      if (getfield(5, msg.fields).value == data.instance) {
        let prm = getfield(6, msg.fields);
        let fld = getfield(7, msg.fields);
        if ((prm != null) && (typeof prm.value != 'undefined') && (fld != null) && (typeof fld.value != 'undefined')) {
          let val = fld.value & 0xFFFFFFFF;
          switch (prm.value) {
            case 0:
              // K-factor flow
              data.kfact_flo = (fld.state == 'V') ? val : null;
              save.kfact_flo = data.kfact_flo / 1024;
              break;
            case 1:
              // K-factor return
              data.kfact_ret = (fld.state == 'V') ? val : null;
              save.kfact_ret = data.kfact_ret / 1024;
              break;
            case 2:
              // Total flow volume
              data.temp_flo_ins = (fld.state == 'V') ? val.toString() : null;
              save.temp_flo_ins = data.temp_flo_ins;
              break;
            case 3:
              // Total return volume
              data.temp_ret_ins = (fld.state == 'V') ? val.toString() : null;
              save.temp_ret_ins = data.temp_ret_ins;
              break;
          }
          data.isValid = true;
        }
      }
    });
  });
  
  onDestroy(() => {
    window.pumaAPI.reml('n2k-flow-s-cfg-data');
    window.pumaAPI.reml('n2k-flow-f-cfg-data');
  });

  function stop(lis) {
    if (lis == 'r5720') {
      if (rtimer != null) {
        clearTimeout(rtimer);
        rtimer = null;
      }
    } else if (lis == 'w5720') {
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
      stop('r5720');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error reading configuration data with this instance.';
      notify = true;
    }, timeout);
    // Receives settings data
    data.isValid = false;
    window.pumaAPI.recv('r5720-done', (e, res) => {
      stop('r5720');
      running = false;
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading configuration data with this instance.';
        notify = true;
      }
    });
    window.pumaAPI.send('c5720-read', [$device, parseInt(data.instance)]);
  };

  function program(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    wtimer = setTimeout(() => {
      stop('w5720');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing configuration data with this instance.';
      notify = true;
    }, timeout);
    // Receives program result
    window.pumaAPI.recv('w5720-done', (e, res) => {
      stop('w5720');
      running = false;
      if (res) {
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
    let val = parseInt(e.detail.mod_ins);
    if (val != save.mod_ins) {
      out.mod_ins = val;
    }
    val = parseInt(e.detail.eng_flo_ins);
    if (val != save.eng_flo_ins) {
      out.eng_flo_ins = val;
    }
    val = parseInt(e.detail.eng_ret_ins);
    if (val != save.eng_ret_ins) {
      out.eng_ret_ins = val;
    }
    val = parseInt(e.detail.temp_flo_ins);
    if (val != save.temp_flo_ins) {
      out.temp_flo_ins = val;
    }
    val = parseInt(e.detail.temp_ret_ins);
    if (val != save.temp_ret_ins) {
      out.temp_ret_ins = val;
    }
    val = parseInt(e.detail.op_mode);
    if (val != save.op_mode) {
      out.op_mode = val;
    }
    val = e.detail.kfact_flo;
    if (val != save.kfact_flo) {
      out.kfact_flo = val * 1024;
    }
    val = e.detail.kfact_ret;
    if (val != save.kfact_ret) {
      out.kfact_ret = val * 1024;
    }
    val = e.detail.total_flo;
    if (val != save.total_flo) {
      out.total_flo = val;
    }
    val = e.detail.total_ret;
    if (val != save.total_ret) {
      out.total_ret = val;
    }
    window.pumaAPI.send('c5720-write', [$device, parseInt(data.instance), out]);
  };

  function reset(e) {
    if (e.detail == 'flow') {
      data.total_flo = 0;
    } else if (e.detail == 'return') {
      data.total_ret = 0;
    }
  }

  function cancel(e) {
    stop('r5720');
    stop('w5720');
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
      <Container5720 style="height: 80vh;" bind:data={data} running={running}
        on:select={select} on:program={program} on:reset={reset} on:cancel={cancel} on:error={error} />
      {#if notify}
        <Notification kind={kind} title={title} subtitle={subttl} bind:notify={notify} />
      {/if}
    </Column>
  </Row>
</Grid>
