<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column, ToastNotification } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container3410 from './partials/Container3410.svelte';
  import { getname } from '../../stores/common.js';
  import { device } from '../../stores/data';

  export let params;

  const model = $location.split('/')[2];
  const timeout = 2000;
  let rtimer = null;
  let wtimer = null;
  let data = {
    instance: params.instance,
    source: null,
    dc_type: null,
    battery_type: null,
    equ_support: null,
    nom_voltage: null,
    chemistry: null,
    capacity: null,
    temp_coeff: null,
    peukert: null,
    chg_eff: null,
  };
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-dc-data', (e, args) => {
      const [ dev, msg ] = args;
      if (msg.fields[4].value == data.instance) {
        let val = msg.fields[6].value & 0xFF;
        switch (msg.fields[5].value) {
          case 0:
            // DC Type (0 = Battery, 1 = Alternator, 2 = Convertor, 3 = Solar Cell, 4 = Wind Generator)
            data.source = msg.header.src;
            data.dc_type = val.toString();
            break;
          case 1:
            // Battery Type (0 = Flooded, 1 = GEL, 2 = AGM)
            data.source = msg.header.src;
            data.battery_type = val.toString();
            break;
          case 2:
            // Supports Equalization (0 = No, 1 = Yes)
            data.source = msg.header.src;
            data.equ_support = val.toString();
            break;
          case 3:
            // Nominal Voltage (0 = 6V, 1 = 12V, 2 = 24V, 3 = 32V, 4 = 36V, 5 = 42V, 6 = 48V)
            data.source = msg.header.src;
            data.nom_voltage = val.toString();
            break;
          case 4:
            // Battery Chemistry (0 = Lead Acid, 1 = LiIon, 2 = NiCad, 3 = ZnO, 4 = NiMH)
            data.source = msg.header.src;
            data.chemistry = val.toString();
            break;
          case 5:
            // Battery Capacity
            data.source = msg.header.src;
            data.capacity = val;
            break;
          case 6:
            // Temperature Coefficient
            data.source = msg.header.src;
            data.temp_coeff = val;
            break;
          case 7:
            // Peukert Exponent
            data.source = msg.header.src;
            data.peukert = val;
            break;
          case 8:
            // Charge Efficiency Factor
            data.source = msg.header.src;
            data.chg_eff = val;
            break;
        }
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
      subttl = 'Error reading circuit type with this instance.';
      notify = true;
    }, timeout);
    data.circuit = null;
    // Receives circuit type result
    window.pumaAPI.recv('r3410-done', (e, res) => {
      stop('r3410');
      running = false;
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading circuit type with this instance.';
        notify = true;
      }
    });
    window.pumaAPI.send('c3410-read', [$device, parseInt(data.instance)]);
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
      $device,
      parseInt(data.instance),
      parseInt(e.detail.dc_type),
      parseInt(e.detail.battery_type),
      parseInt(e.detail.equ_support),
      parseInt(e.detail.nom_voltage),
      parseInt(e.detail.chemistry),
      parseInt(e.detail.capacity),
      parseInt(e.detail.temp_coeff),
      parseInt(e.detail.peukert),
      parseInt(e.detail.chg_eff),
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

  select();
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