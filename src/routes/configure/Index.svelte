<script>
  import { push } from "svelte-spa-router";
  import { findModel, selected } from "../../stores/data.js";
  import { getfunc, getdev } from "../../config/devices.js";
  import Selector from "../../components/Selector.svelte";

  let devs = getfunc('conf');

  function select(e) {
    $selected.device = e.detail.device;
    let dev = getdev(e.detail.device)
    let ins = '0';
    let pro = findModel(e.detail.device);
    if (pro !== null && Array.isArray(pro) && pro.length > 0) {
      ins = pro[0].name.deviceInstance.toString();
    }
    push('/configure/' + e.detail.device + '/' + ins + (dev.fluid ? '/0' : ''));
  }
</script>

<Selector devices={devs} bind:tab={$selected.config} bind:dev={$selected.device} on:select={select} />
