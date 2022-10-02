<script>
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { pop } from "svelte-spa-router";
  import VolumeContainer from './partials/VolumeContainer.svelte';

  export let params;

  const plf = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
  const timeout = 5000;
  let timer = null;
  let data = {
    fluid: '0',
    instance: '0',
    capacity: null,
    table: new Array(),
    mode: '0',
  };
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

  function load(e) {
    running = true;
    timer = setTimeout(() => {
      stop('volfile');
      running = false;
    }, timeout);
    data.table = new Array();
    // Receives volume file data
    window.pumaAPI.recv('volfile-data', (e, dat) => {
      data = JSON.parse(JSON.stringify(dat));
    });
    // Receives volume file result
    window.pumaAPI.recv('volfile-done', (e, res) => {
      stop('volfile');
      running = false;
    });
    window.pumaAPI.send('volfile-read');
  };

  function save(e) {
    running = true;
    timer = setTimeout(() => {
      stop('volfile');
      running = false;
    }, timeout);
    // Receives volume file result
    window.pumaAPI.recv('volfile-done', (e, res) => {
      stop('volfile');
      running = false;
    });
    window.pumaAPI.send('volfile-write', JSON.parse(JSON.stringify(data)));
  };

  function getmode(e) {
    running = true;
    timer = setTimeout(() => {
      stop('volmode');
      running = false;
    }, timeout);
    data.mode = null;
    // Receives volume mode data
    window.pumaAPI.recv('volmode-data', (e, mode) => {
      data.mode = mode.toString();
    });
    // Receives volume mode result
    window.pumaAPI.recv('volmode-done', (e, res) => {
      stop('volmode');
      running = false;
    });
    window.pumaAPI.send('volmode-read');
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
    let dat = {
      fluid: data.fluid,
      instance: data.instance,
      mode: data.mode,
    };
    window.pumaAPI.send('volmode-write', dat);
  };

  function download(e) {
    running = true;
    timer = setTimeout(() => {
      stop('voltable');
      running = false;
    }, timeout);
    data.table = new Array();
    // Receives volume table data
    window.pumaAPI.recv('voltable-data', (e, dat) => {
      data = JSON.parse(JSON.stringify(dat));
    });
    // Receives volume table result
    window.pumaAPI.recv('voltable-done', (e, res) => {
      stop('voltable');
      running = false;
    });
    window.pumaAPI.send('voltable-read');
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
    window.pumaAPI.send('voltable-write', JSON.parse(JSON.stringify(data)));
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
      <h2>{params.adaptor + ' - Programming'}</h2>
      <VolumeContainer style="height: 80vh;" bind:data={data} running={running}
        on:load={load} on:save={save} on:getmode={getmode} on:setmode={setmode} on:download={download}
        on:upload={upload} on:cancel={cancel} />
    </Column>
  </Row>
</Grid>

<style lang="css">
</style>