<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column, ToastNotification } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container3420 from './partials/Container3420.svelte';
  import { getname } from '../../stores/common.js';

  export let params;

  const plf = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';

  const device = $location.split('/')[2];
  const timeout = 2000;
  let timer = null;
  let data = {
    instance: params.instance,
    circuit: null,
  };
  let running = false;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount(() => {
    window.pumaAPI.recv('n2k-3420', (e, args) => {
      const [ dev, msg ] = args;
      if (msg.fields[4].value == data.instance) {
        switch (msg.fields[5].value) {
          case 0:
            // Circuit Type (1 = Single Phase, 2 = Duble Phase, 3 = Three Phase, 4 = Split Phase)
            data.circuit = (msg.fields[6].value - 1).toString();
            stop('circuit');
            running = false;
            break;
          case 1:
            // Device Instance
            data.instance = msg.fields[6].value.toString();
            stop('instance');
            running = false;
            break;
        }
      }
    });
    getcircuit();
  });
  
  onDestroy(() => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    running = false;
    window.pumaAPI.reml('n2k-3420');
  });

  function stop(lis) {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    // Remove listeners
    window.pumaAPI.reml(lis + '-done');
  };

  // function load(e) {
  //   running = true;
  //   data.table = new Array();
  //   // Receives volume file data
  //   window.pumaAPI.recv('volfile-data', (e, res) => {
  //     if (res instanceof Error) {
  //       kind = 'error'
  //       title = 'Error';
  //       subttl = res;
  //       notify = true;
  //     } else {
  //       data = JSON.parse(JSON.stringify(res));
  //     }
  //   });
  //   // Receives volume file result
  //   window.pumaAPI.recv('volfile-done', (e) => {
  //     running = false;
  //     stop('volfile');
  //     window.pumaAPI.reml('volfile-data');
  //   });
  //   window.pumaAPI.send('volfile-read');
  // };

  // function save(e) {
  //   running = true;
  //   // Receives volume file result
  //   window.pumaAPI.recv('volfile-done', (e, res) => {
  //     if (res instanceof Error) {
  //       kind = 'error'
  //       title = 'Error';
  //       subttl = res;
  //       notify = true;
  //     } else {
  //       kind = 'info'
  //       title = 'Success';
  //       subttl = 'Volume table has been saved.';
  //       notify = true;
  //     }
  //     stop('volfile');
  //     running = false;
  //   });
  //   window.pumaAPI.send('volfile-write', JSON.parse(JSON.stringify(data)));
  // };

   function getcircuit(e) {
    running = true;
    timer = setTimeout(() => {
      kind = 'error'
      title = 'Error';
      subttl = 'Error reading circuit type with this instance.';
      notify = true;
      running = false;
    }, timeout);
    data.circuit = null;
    // Receives volume mode result
    window.pumaAPI.recv('circuit-done', (e, res) => {
      if (!res) {
        kind = 'error'
        title = 'Error';
        subttl = 'Error reading circuit with this instance.';
        notify = true;
        stop('circuit');
        running = false;
      }
    });
    window.pumaAPI.send('circuit-read', [data.instance]);
  };

  // function setmode(e) {
  //   running = true;
  //   timer = setTimeout(() => {
  //     kind = 'error'
  //     title = 'Error';
  //     subttl = 'Error writing mode with this fluid type and instance.';
  //     notify = true;
  //     stop('volmode');
  //     running = false;
  //   }, timeout);
  //   // Receives volume mode result
  //   window.pumaAPI.recv('volmode-done', (e, res) => {
  //     if (res) {
  //       kind = 'info'
  //       title = 'Success';
  //       subttl = 'Volume mode has been sent.';
  //       notify = true;
  //     } else {
  //       kind = 'error'
  //       title = 'Error';
  //       subttl = 'Error writing mode with this fluid type and instance.';
  //       notify = true;
  //     }
  //     stop('volmode');
  //     running = false;
  //   });
  //   window.pumaAPI.send('volmode-write', [data.fluid, data.instance, data.mode]);
  // };

  // function download(e) {
  //   running = true;
  //   timer = setTimeout(() => {
  //     kind = 'error'
  //     title = 'Error';
  //     subttl = 'Error reading table with this fluid type and instance.';
  //     notify = true;
  //     running = false;
  //   }, timeout);
  //   data.table = new Array();
  //   // Receives volume table result
  //   window.pumaAPI.recv('voltable-done', (e, res) => {
  //     if (!res) {
  //       kind = 'error'
  //       title = 'Error';
  //       subttl = 'Error reading table with this fluid type and instance.';
  //       notify = true;
  //       stop('voltable');
  //       running = false;
  //     }
  //   });
  //   window.pumaAPI.send('voltable-read', [data.fluid, data.instance]);
  // };

  // function upload(e) {
  //   running = true;
  //   timer = setTimeout(() => {
  //     kind = 'error'
  //     title = 'Error';
  //     subttl = 'Error writing table with this fluid type and instance.';
  //     notify = true;
  //     stop('voltable');
  //     running = false;
  //   }, timeout);
  //   // Receives volume table result
  //   window.pumaAPI.recv('voltable-done', (e, res) => {
  //     if (res) {
  //       kind = 'info'
  //       title = 'Success';
  //       subttl = 'Volume table has been sent.';
  //       notify = true;
  //     } else {
  //       kind = 'error'
  //       title = 'Error';
  //       subttl = 'Error writing table with this fluid type and instance.';
  //       notify = true;
  //     }
  //     stop('voltable');
  //     running = false;
  //   });
  //   let dat = '';
  //   data.table.forEach((elm) => {
  //     dat += String.fromCharCode(elm.pervol);
  //   });
  //   window.pumaAPI.send('voltable-write', [data.fluid, data.instance, dat, data.capacity]);
  // };

  function cancel(e) {
    // stop('volfile');
    // stop('volmode');
    // stop('voltable');
    running = false;
    pop();

  };
</script>

<Grid>
  <Row>
    <Column>
      <h2>{device + ' ' + getname(device) + ' - Configuration'}</h2>
      <Container3420 style="height: 80vh;" bind:data={data} running={running} on:cancel={cancel} />
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