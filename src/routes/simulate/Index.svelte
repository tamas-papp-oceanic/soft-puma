<script>
  import { onMount } from "svelte";
  import SimulateContainer from "./partials/SimulateContainer.svelte";
  import nmeadefs from "../../config/nmeadefs.json";
  import { nextIncremetal, nextDecremetal, nextNatural,
    nextRandom } from '../../helpers/simulate.js';

  let data = {
    table: new Array(),
    simulation: null,
  };
  let loading = true;
  let running = false;
  let selected = {};

  onMount((e) => {
    data.simulation = 0;
    for (const [key, val] of Object.entries(nmeadefs)) {
      let ins = null;
      for (let i in val.fields) {
        if (typeof val.fields[i].instance !== 'undefined') {
          ins = 0;
          break;
        }
      }
      data.table.push({ key: key, val: val, ins: ins });
    }
    loading = false;
  });

  function setsim(e) {
    data.simulation = e.detail.selectedId;
  };

  function start(e) {
    running = true;
  };

  function select(e) {
    if (e.detail.selected) {
      selected[e.detail.row.id] = true;
    } else {
      delete selected[e.detail.row.id];
    }
  };

  function stop(e) {
    running = false;
  };

  function cancel(e) {
    running = false;
    pop();
  };
</script>

<SimulateContainer bind:data={data} loading={loading} running={running} on:start={start} on:setsim={setsim} on:select={select} on:stop={stop} on:cancel={cancel} style="height: 80vh;" />
