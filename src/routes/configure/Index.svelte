<script>
  import { push } from 'svelte-spa-router'
  import { findModel, selected } from '../../stores/data.js'
  import { getfunc } from '../../stores/common.js'
  import Selector from '../../components/Selector.svelte';

  let devs = getfunc('conf');

  function select(e) {
    $selected.device = e.detail.device;
    let ins = '0';
    let pro = findModel(e.detail.device);
    if ((pro !== null) && (Array.isArray(pro)) && (pro.length > 0)) {
      ins = pro[0].name.deviceInstance.toString();
    }
    push('/configure/' + e.detail.device + '/' + ins + (
      (e.detail.group != 'displays') && (
        (e.detail.device.includes('3125') ||
        e.detail.device.includes('3271') ||
        e.detail.device.includes('3271_SAM') ||
        e.detail.device.includes('3281') ||
        e.detail.device.includes('4291')) ?  '/0' : '')
    ));
  };
</script>

<Selector devices={devs} bind:tab={$selected.config} bind:dev={$selected.device} on:select={select} />
