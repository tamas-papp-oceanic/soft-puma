<script>
  import { push } from 'svelte-spa-router'
  import { findModel, selected } from '../../stores/data.js'
  import { checkAccess } from '../../auth/auth'
  import { loggedIn } from '../../stores/user.js'
  import { getfunc } from '../../config/devices.js'
  import Selector from '../../components/Selector.svelte'

  let devs = getfunc('test');

  function select(e) {
    $selected.device = e.detail.device;
    let ins = '0';
    let pro = findModel(e.detail.device);
    if ((pro !== null) && (Array.isArray(pro)) && (pro.length > 0)) {
      ins = pro[0].name.deviceInstance.toString();
    }
    push('/testing/' + e.detail.device + (e.detail.group != 'displays' ? '/' + ins : ''));
  };

  $: if (checkAccess('test', 'write') && $loggedIn) {
    devs['displays'] = ['5185',  '5185-H'];
  } else {
    devs['displays'] = new Array();
  }
</script>

<Selector devices={devs} bind:tab={$selected.test} bind:dev={$selected.device} on:select={select} />
