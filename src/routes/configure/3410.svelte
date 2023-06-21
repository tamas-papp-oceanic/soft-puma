<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column, ToastNotification } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container3410 from './partials/Container3410.svelte';
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
    dc_type: null,
    batt_type: null,
    equ_support: null,
    nom_voltage: null,
    chemistry: null,
    capacity: null,
    temp_eff: null,
    peukert: null,
    chrg_eff: null,
    isValid: false,
  };
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-dc-cfg-data', (e, args) => {
      const [ dev, msg ] = args;
      if (getfield(6, msg.fields).value == data.instance) {
        let fld = null;
        // DC Type (0 = Battery, 1 = Alternator, 2 = Convertor, 3 = Solar Cell, 4 = Wind Generator)
        fld = getfield(7, msg.fields);
        data.dc_type = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
        // Battery Type (0 = Flooded, 1 = GEL, 2 = AGM)
        fld = getfield(8, msg.fields);
        data.batt_type = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
        // Supports Equalization (0 = No, 1 = Yes)
        fld = getfield(9, msg.fields);
        data.equ_support = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
        // Nominal Voltage (0 = 6V, 1 = 12V, 2 = 24V, 3 = 32V, 4 = 36V, 5 = 42V, 6 = 48V)
        fld = getfield(11, msg.fields);
        data.nom_voltage = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
        // Battery Chemistry (0 = Lead Acid, 1 = LiIon, 2 = NiCad, 3 = ZnO, 4 = NiMH)
        fld = getfield(12, msg.fields);
        data.chemistry = (fld != null ) && (fld.state == 'V') ? fld.value.toString() : null;
        // Battery Capacity
        fld = getfield(13, msg.fields);
        data.capacity = (fld != null ) && (fld.state == 'V') ? fld.value : null;
        // Temperature Coefficient
        fld = getfield(14, msg.fields);
        data.temp_eff = (fld != null ) && (fld.state == 'V') ? fld.value : null;
        // Peukert Exponent
        fld = getfield(15, msg.fields);
        data.peukert = (fld != null ) && (fld.state == 'V') ? (fld.value * 0.002) + 1 : null;
        // Charge Efficiency Factor
        fld = getfield(16, msg.fields);
        data.chrg_eff = (fld != null ) && (fld.state == 'V') ? fld.value : null;
        // Validity
        data.isValid = true;
      }
    });
  });
  
  onDestroy(() => {
    window.pumaAPI.reml('n2k-dc-data');
  });

  function stop(lis) {
    if (lis == 'r3410') {
      if (rtimer != null) {
        clearTimeout(rtimer);
        rtimer = null;
      }
    } else if (lis == 'w3410') {
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
      stop('r3410');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error reading settings data with this instance.';
      notify = true;
    }, timeout);
    // Receives settings data
    data.dc_type = null;
    data.batt_type = null;
    data.equ_support = null;
    data.nom_voltage = null;
    data.chemistry = null;
    data.capacity = null;
    data.temp_eff = null;
    data.peukert = null;
    data.chrg_eff = null;
    data.isValid = false;
    window.pumaAPI.recv('r3410-done', (e, res) => {
      stop('r3410');
      running = false;
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading settings data with this instance.';
        notify = true;
      }
    });
    window.pumaAPI.send('c3410-read', [$device, 2, parseInt(data.instance), parseInt(data.source)]);
  };

  function program(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    wtimer = setTimeout(() => {
      stop('w3410');
      running = false;
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing parameter with this instance.';
      notify = true;
    }, timeout);
    // Receives program result
    window.pumaAPI.recv('w3410-done', (e, res) => {
      stop('w3410');
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
    window.pumaAPI.send('c3410-write', [
      $device, 2, parseInt(data.instance), parseInt(data.source), {
        dc_type: parseInt(e.detail.dc_type),
        batt_type: parseInt(e.detail.batt_type),
        equ_support: parseInt(e.detail.equ_support),
        nom_voltage: parseInt(e.detail.nom_voltage),
        chemistry: parseInt(e.detail.chemistry),
        capacity: e.detail.capacity,
        temp_eff: e.detail.temp_eff,
        peukert: Math.round((e.detail.peukert - 1) / 0.002),
        chrg_eff: e.detail.chrg_eff,
      },
    ]);
  };

  function cancel(e) {
    stop('r3410');
    stop('w3410');
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
      <Container3410 style="height: 80vh;" bind:data={data} running={running}
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