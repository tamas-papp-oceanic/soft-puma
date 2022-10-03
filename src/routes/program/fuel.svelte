<script>
  import { onMount, onDestroy } from "svelte";
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

  onMount(() => {
    window.pumaAPI.recv('n2k-data', (e, args) => {
      const [ dev, msg ] = args;
      // <protocol>/<pgn>/<function>/<manufacturer>/<industry>/<instance>/<type>
      let spl = msg.key.split('/');
      if ((spl[0] == 'nmea2000') && (spl[3] == '161')  && (spl[4] == '4')) {
        switch (spl[1]) {
          case '065289':
            switch (spl[2]) {
              case '6':
                // Stored Mode Data (0 = Level Mode, 1 = Volumetric Mode)
                if (timer != null) {
                  clearTimeout(timer);
                  timer = null
                }
                if ((msg.fields[3].value == data.instance) && (msg.fields[4].value == data.fluid)) {
                  data.mode = msg.fields[6].value.toString();
                  running = false;
                }
                break;
            }
            break;
          case '130825':
            switch (spl[2]) {
              case '3':
                // Stored Volumetric Data
                if (timer != null) {
                  clearTimeout(timer);
                  timer = null
                }
                if ((msg.fields[3].value == data.instance) && (msg.fields[4].value == data.fluid)) {
                  data.table = new Array();
                  data.capacity = msg.fields[7].value * 1000;
                  let arr = Array.from(msg.fields[6].value, (x) => x.charCodeAt(0));
                  for (let i in arr) {
                    data.table.push({
                      'id': i.toString(), 'perlvl': i, 'pervol': arr[i],
                      'volume': Math.round(arr[i] * data.capacity) / 100,
                    });
                  }
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
    window.pumaAPI.reml('n2k-data');
  });

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
    data.table = new Array();
    // Receives volume file data
    window.pumaAPI.recv('volfile-data', (e, dat) => {
      data = JSON.parse(JSON.stringify(dat));
    });
    // Receives volume file result
    window.pumaAPI.recv('volfile-done', (e) => {
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
      running = false;
    }, timeout);
    data.mode = null;
    window.pumaAPI.send('volmode-read', [ data.fluid, data.instance ]);
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
      running = false;
    }, timeout);
    data.table = new Array();
    window.pumaAPI.send('voltable-read', [ data.fluid, data.instance ]);
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