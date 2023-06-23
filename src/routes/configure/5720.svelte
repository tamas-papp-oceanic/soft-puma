<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column, ToastNotification } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container5720 from './partials/Container5720.svelte';
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
    press_ins: null,
    press_src: null,
    press_rng: null,
    press_dmp: null,
    isValid: false,
  };
  let save = JSON.parse(JSON.stringify(data));
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-press-cfg-data', (e, args) => {
      const [ dev, msg ] = args;
      if (getfield(5, msg.fields).value == data.instance) {
        let prm = getfield(6, msg.fields);
        let fld = getfield(7, msg.fields);
        if ((prm != null) && (typeof prm.value != 'undefined') && (fld != null) && (typeof fld.value != 'undefined')) {
          let val = fld.value & 0xFF;
          switch (prm.value) {
            case 0:
              // Instance configuration type
              data.conf_type = (fld.state == 'V') ? val.toString() : null;
              save.conf_type = data.conf_type;
              break;
            case 1:
              // Pressure instance
              data.press_ins = (fld.state == 'V') ? val.toString() : null;
              save.press_ins = data.press_ins;
              break;
            case 2:
              // Pressure source
              data.press_src = (fld.state == 'V') ? val.toString() : null;
              save.press_src = data.press_src;
              break;
            case 3:
              // Pressure range
              data.press_rng = (fld.state == 'V') ? val.toString() : null;
              save.press_rng = data.press_rng;
              break;
            case 4:
              // Pressure damping
              data.press_dmp = (fld.state == 'V') ? val.toString() : null;
              save.press_dmp = data.press_dmp;
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
    if (lis == 'r4601') {
      if (rtimer != null) {
        clearTimeout(rtimer);
        rtimer = null;
      }
    } else if (lis == 'w4601') {
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
      stop('r4601');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error reading settings data with this instance.';
      notify = true;
    }, timeout);
    // Receives settings data
    data.isValid = false;
    window.pumaAPI.recv('r4601-done', (e, res) => {
      stop('r4601');
      running = false;
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading settings data with this instance.';
        notify = true;
      }
    });
    window.pumaAPI.send('c4601-read', [$device, parseInt(data.instance)]);
  };

  function program(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    let chg = false;
    wtimer = setTimeout(() => {
      stop('w4601');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing parameter with this instance.';
      notify = true;
    }, timeout);
    // Receives program result
    window.pumaAPI.recv('w4601-done', (e, res) => {
      stop('w4601');
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
    val = parseInt(e.detail.press_ins);
    if (val != save.press_ins) {
      out.press_ins = val;
    }
    val = parseInt(e.detail.press_src);
    if (val != save.press_src) {
      out.press_src = val;
    }
    val = parseInt(e.detail.press_rng);
    if (val != save.press_rng) {
      out.press_rng = val;
    }
    val = parseInt(e.detail.press_dmp);
    if (val != save.press_dmp) {
      out.press_dmp = val;
    }
    window.pumaAPI.send('c4601-write', [$device, parseInt(data.instance), out]);
  };

  function cancel(e) {
    stop('r4601');
    stop('w4601');
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