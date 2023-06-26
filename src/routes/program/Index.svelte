<script>
  import { push } from 'svelte-spa-router'
  import { findModel, selected } from '../../stores/data.js'
  import { getfunc } from '../../stores/common.js'
  import Selector from "../../components/Selector.svelte";

  const devs = getfunc('prog');

  function select(e) {
    $selected.device = e.detail.device;
    let ins = '0';
    let pro = findModel(e.detail.device);
    if ((pro !== null) && (Array.isArray(pro)) && (pro.length > 0)) {
      ins = pro[0].name.deviceInstance.toString();
    }
    push('/program/' + e.detail.device + (e.detail.group != 'displays' ? '/' + ins : ''));
  };
</script>

<Selector devices={devs} bind:tab={$selected.program} bind:dev={$selected.device} on:select={select} />
