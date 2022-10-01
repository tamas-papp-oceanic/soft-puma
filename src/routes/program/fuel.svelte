<script>
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { pop } from "svelte-spa-router";
  import VolumeContainer from './partials/VolumeContainer.svelte';

  export let params;

  const plf = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
  const timeout = 5000;
  let timer = null;
  let mode = '0';
  let table = new Array();
  let running = false;

  function stop(lis) {
    if (timer != null) {
      clearTimeout(timer);
      timer = null
    }
    // Remove listeners
    window.pumaAPI.reml(lis + '-data');
    window.pumaAPI.reml(lis + '-done');
  }

  function open(e) {
  };

  function save(e) {
  };

  function getmode(e) {
    running = true;
    timer = setTimeout(() => {
      stop('volmode');
      running = false;
    }, timeout);
    mode = null;
    // Receives volume mode data
    window.pumaAPI.recv('volmode-data', (e, data) => {
      mode = data;
      stop('volmode');
      running = false;
    });
  };

  function setmode(e) {
    running = true;
    timer = setTimeout(() => {
      stop('volmode');
      running = false;
    }, timeout);
    // Receives volume mode result
    window.pumaAPI.recv('volmode-done', (e, res) => {
      stop('volmode');
      running = false;
    });
    window.pumaAPI.send('volmode-start', mode);
  };

  function download(e) {
    // running = true;
    // timer = setTimeout(() => {
    //   stop('voltable');
    //   running = false;
    // }, timeout);
    table = new Array();


// TEST
for (let i = 0; i < 100; i++) {
  table.push({ 'id': i, 'perlvl': i, 'pervol': i, 'volume': i * 1000 });
}
console.log(table)
// TEST


    // Receives volume table data
    // window.pumaAPI.recv('voltable-data', (e, data) => {
    //   table = data;
    //   stop('voltable');
    //   running = false;
    // });
  };

  function upload(e) {
    running = true;
    timer = setTimeout(() => {
      stop('voltable');
      running = false;
    }, timeout);
    // Receives volume table result
    window.pumaAPI.recv('voltable-done', (e, res) => {
      stop('voltable');
      running = false;
    });
    window.pumaAPI.send('voltable-start', table);
  };

  function cancel(e) {
    stop('volmode');
    stop('voltable');
    running = false;
    pop();
  };
</script>

<Grid>
  <Row>
    <Column>
      <h2>{params.adaptor + ' - Programming'}</h2>
      <VolumeContainer bind:mode={mode} bind:table={table} running={running} style="height: 80vh;"
        on:open={open} on:save={save} on:getmode={getmode} on:setmode={setmode} on:download={download}
        on:upload={upload} on:cancel={cancel} />
    </Column>
  </Row>
</Grid>

<style lang="css">
</style>