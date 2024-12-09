<script>
  import { onMount } from "svelte";
  import { Row, Grid, Column, InlineNotification } from "carbon-components-svelte";
	import { location, pop } from 'svelte-spa-router'
  import TestContainer from './partials/TestContainer.svelte';
  import testG from './tests/5185G.json';
  import testH from './tests/5185H.json';
  import { device } from '../../stores/data.js';
  import { scanDevice, waitDevice, startForm } from './tests/5185.js';
  import { initRun, runStep, nextStep, runScript, setStoreValue, lastStep, stopTests } from "./tests/runner.js"
  import { _steps, _events, _current } from '../../stores/tests.js';
  import { getname } from '../../config/devices.js';

  const devname = $location.split('/')[2];
  const variant = (devname == '5185-H' ? 'Honda' : null);
  const actions = {
    "scan-device": scanDevice,
    "wait-device": waitDevice,
    "start-form": startForm,
  };
  let events = {};
  let step;
  let test;

  // On mount event  
  onMount(async () => {
    if (devname == '5185-H') {
      test = testH;
    } else {
      test = testG;
    }
    initRun(test.steps, actions, events, variant);
    await runStep();
  });
  // Submit button event
  async function submit(e) {
    let val = false;
    let stp = false;
    let cur = $_steps[$_current];
    if (typeof cur !== 'undefined') {
      val = true;
      if (typeof cur.last !== 'undefined') {
        stp = true;
      } else if (typeof cur.inputs !== 'undefined') {
        for (let i in cur.inputs) {
          let wrp = document.getElementById(cur.inputs[i].id);
          cur.inputs[i].error.active = false;
          if (cur.inputs[i].id == 'serial') {
            // let num = parseInt(wrp.value);
            // if ((wrp.value.length == 0) || (wrp.value.length > 7)) {
            //   cur.inputs[i].error.active = true;
            //   $_steps[$_current] = cur;
            // } else if (isNaN(num)) {
            //   cur.inputs[i].error.active = true;
            //   $_steps[$_current] = cur;
            if ((wrp.value.length == 0) ||
              ((variant == 'Honda') && ((wrp.value.length > 12) || !wrp.value.startsWith('UZSY-') || isNaN(wrp.value.substr(5)))) ||
              ((variant != 'Honda') && ((wrp.value.length > 7) || isNaN(wrp.value)))
            ) {
              cur.inputs[i].error.active = true;
              $_steps[$_current] = cur;
            } else {
              let num = 0;
              let stv = '';
              // let stv = num.toString().padStart(7, '0');
              // if (variant == 'Honda') {
              //   stv = 'UZSY-' + stv;
              // }
              if (variant == 'Honda') {
                num = parseInt(wrp.value.substr(5)).toString().padStart(7, '0');
                stv = wrp.value;
              } else {
                num = parseInt(wrp.value);
                stv = num.toString().padStart(7, '0');
              }
              await setStoreValue({ variable: 'serial', value: stv });
              window.pumaAPI.send('ser-num', [$device, num]);
            }
          }
          if (cur.inputs[i].error.active) {
            wrp.focus();
            val = false;
          }
        }
      }
    }
    if (val) {
      let suc = $_steps[$_current].onSuccess;
      if (typeof suc !== 'undefined') {
        runScript(suc);
      }
      if (stp) {
        pop();
      } else {
        await nextStep();
        await runStep();
      }
    }
  };
  // Cancel button event
  async function cancel(e) {
    let cur = $_steps[$_current];
    if (typeof cur !== 'undefined') {
      if (typeof cur.testCode !== 'undefined') {
        let scr = { "action": "add-log", "testCode": cur.testCode, "testValue": 0 }
        runScript(scr);
      }
    }
    await setStoreValue({variable: 'result', value: false });
    await stopTests();
    await lastStep();
    await runStep();
  };
  // Data getters
  $: step = $_steps[$_current];
</script>

<Grid>
  <Row>
    <Column>
      <h2>{devname + ' ' + getname(devname) + ' - Test Suite'}</h2>
      <InlineNotification
        hideCloseButton
        kind="info"
        title="Programming of this device is performed outside of Puma."
        subtitle="Please refer to the SOP."
      />
      <TestContainer step={step} on:submit={submit} on:cancel={cancel} style="height: 65vh;" />
    </Column>
  </Row>
</Grid>

<style lang="css">
</style>