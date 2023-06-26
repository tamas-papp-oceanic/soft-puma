<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column, ToastNotification } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import VolumeContainer from './partials/VolumeContainer.svelte';
  import { getname } from '../../config/devices.js';
  import { device } from '../../stores/data.js';

  export let params;

  const model = $location.split('/')[2];
  const timeout = 2000;
  let timer = null;
  let data = {
    fluid: params.fluid,
    instance: params.instance,
    capacity: null,
    table: new Array(),
    mode: null,
  };
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-volume', (e, args) => {
      const [ dev, msg ] = args;
      // <protocol>/<pgn>/<function>/<manufacturer>/<industry>/<instance>/<type>
      let spl = msg.key.split('/');  
      if ((spl[0] == 'nmea2000') && (spl[3] == '161')  && (spl[4] == '4')) {
        switch (spl[1]) {
          case '065289':          
          case '130825':
            switch (spl[2]) {
              case '3':
                // Stored Volumetric Data
                if ((msg.fields[3].value == data.instance) && (msg.fields[4].value == data.fluid)) {
                  data.table = new Array();
                  data.capacity = msg.fields[7].value * 1000; // m3 -> L
                  let arr = Array.from(msg.fields[6].value, (x) => x.charCodeAt(0));
                  for (let i in arr) {
                    data.table.push({
                      'id': i.toString(), 'perlvl': i, 'pervol': arr[i],
                      'volume': Math.round(arr[i] * data.capacity) / 100,
                    });
                  }
                  stop('voltable');
                  running = false;
                }
                break;
              case '6':
                // Stored Mode Data (0 = Level Mode, 1 = Volumetric Mode)
                if ((msg.fields[3].value == data.instance) && (msg.fields[4].value == data.fluid)) {
                  data.mode = msg.fields[6].value.toString();
                  stop('volmode');
                  running = false;
                }
                break;
            }
            break;
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
    window.pumaAPI.reml('n2k-volume');
  });

  function stop(lis) {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    // Remove listeners
    window.pumaAPI.reml(lis + '-done');
  };

  function load(e) {
    running = true;
    data.table = new Array();
    // Receives volume file data
    window.pumaAPI.recv('volfile-data', (e, res) => {
      if (res instanceof Error) {
        kind = 'error'
        title = 'Error';
        subttl = res;
        notify = true;
      } else {
        data = JSON.parse(JSON.stringify(res));
      }
    });
    // Receives volume file result
    window.pumaAPI.recv('volfile-done', (e) => {
      running = false;
      stop('volfile');
      window.pumaAPI.reml('volfile-data');
    });
    window.pumaAPI.send('volfile-read');
  };

  function save(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    // Receives volume file result
    window.pumaAPI.recv('volfile-done', (e, res) => {
      if (res instanceof Error) {
        kind = 'error'
        title = 'Error';
        subttl = res;
        notify = true;
      } else {
        kind = 'info'
        title = 'Success';
        subttl = 'Volume table has been saved.';
        notify = true;
      }
      stop('volfile');
      running = false;
    });
    window.pumaAPI.send('volfile-write', JSON.parse(JSON.stringify(data)));
  };

  function getmode(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    timer = setTimeout(() => {
      kind = 'error'
      title = 'Error';
      subttl = 'Error reading mode with this fluid type and instance.';
      notify = true;
      running = false;
    }, timeout);
    data.mode = null;
    // Receives volume mode result
    window.pumaAPI.recv('volmode-done', (e, res) => {
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading mode with this fluid type and instance.';
        notify = true;
        stop('volmode');
        running = false;
      }
    });
    window.pumaAPI.send('volmode-read', [$device, data.fluid, data.instance]);
  };

  function setmode(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    timer = setTimeout(() => {
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing mode with this fluid type and instance.';
      notify = true;
      stop('volmode');
      running = false;
    }, timeout);
    // Receives volume mode result
    window.pumaAPI.recv('volmode-done', (e, res) => {
      if (res) {
        kind = 'info'
        title = 'Success';
        subttl = 'Volume mode has been sent.';
        notify = true;
      } else {
        kind = 'error'
        title = 'Error';
        subttl = 'Error writing mode with this fluid type and instance.';
        notify = true;
      }
      stop('volmode');
      running = false;
    });
    window.pumaAPI.send('volmode-write', [$device, data.fluid, data.instance, data.mode]);
  };

  function download(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    timer = setTimeout(() => {
      kind = 'error'
      title = 'Error';
      subttl = 'Error reading table with this fluid type and instance.';
      notify = true;
      running = false;
    }, timeout);
    data.table = new Array();
    // Receives volume table result
    window.pumaAPI.recv('voltable-done', (e, res) => {
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading table with this fluid type and instance.';
        notify = true;
        stop('voltable');
        running = false;
      }
    });
    window.pumaAPI.send('voltable-read', [$device, data.fluid, data.instance]);
  };

  function upload(e) {
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    timer = setTimeout(() => {
      kind = 'error'
      title = 'Error';
      subttl = 'Error writing table with this fluid type and instance.';
      notify = true;
      stop('voltable');
      running = false;
    }, timeout);
    // Receives volume table result
    window.pumaAPI.recv('voltable-done', (e, res) => {
      if (res) {
        kind = 'info'
        title = 'Success';
        subttl = 'Volume table has been sent.';
        notify = true;
      } else {
        kind = 'error'
        title = 'Error';
        subttl = 'Error writing table with this fluid type and instance.';
        notify = true;
      }
      stop('voltable');
      running = false;
    });
    let dat = '';
    data.table.forEach((elm) => {
      dat += String.fromCharCode(elm.pervol);
    });
    window.pumaAPI.send('voltable-write', [$device, data.fluid, data.instance, dat, data.capacity / 1000]);  // L -> m3
  };

  function cancel(e) {
    stop('volfile');
    stop('volmode');
    stop('voltable');
    running = false;
    pop();
  };
</script>

<Grid>
  <Row>
    <Column>
      <h2>{model + ' - ' + getname(model) + ' - Configuration'}</h2>
      <VolumeContainer style="height: 80vh;" bind:data={data} running={running}
        on:load={load} on:save={save} on:getmode={getmode} on:setmode={setmode} on:download={download}
        on:upload={upload} on:cancel={cancel} />
      {#if notify}
        <div class="error">
          <ToastNotification
            kind={kind}
            title={title}
            subtitle={subttl}
            caption={new Date().toLocaleString()}
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