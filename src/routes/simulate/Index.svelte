<script>
  import { onMount } from "svelte";
  import nmeadefs from "../../config/nmeadefs.json";
  import SimulateContainer from "./partials/SimulateContainer.svelte";

  let data = {
    table: new Array(),
  };
  let running = false;

  onMount((e) => {
    for (const [key, val] of Object.entries(nmeadefs)) {
      data.table.push({ key: key, val: val });
    }
  });

  function cancel(e) {
    running = false;
    pop();
  };

</script>

<SimulateContainer bind:data={data} running={running} style="height: 80vh;" on:cancel={cancel} />
