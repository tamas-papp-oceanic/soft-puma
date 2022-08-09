<script>
  import { onMount } from "svelte";
  import { Row, Grid, Column, InlineNotification } from "carbon-components-svelte";
	import { pop } from 'svelte-spa-router'
  import TestContainer from './partials/TestContainer.svelte';
  import testG from './tests/5185G.json';
  import testH from './tests/5185H.json';
  import { next, scanDevice, waitDevice, startForm, startTests,
    startTest, waitTest, stopTests, startUpdate } from './tests/5185.js';
  import { initRun, runStep, nextStep, runScript, setStoreValue } from "./tests/runner.js"
  import { _steps, _events, _current } from '../../stores/tests.js';

  export let params;

  let actions = {
    "next": next,
    "scan-device": scanDevice,
    "wait-device": waitDevice,
    "start-form": startForm,
    "start-tests": startTests,
    "start-test": startTest,
    "wait-test": waitTest,
    "stop-tests": stopTests,
    "start-update": startUpdate,
  };
  let events = {};
  let step;
  let test;

  // On mount event  
  onMount(async () => {
    if ((typeof params.variant !== 'undefined') && (params.variant == 'Honda')) {
      test = testH;
    } else {
      test = testG;
    }
    initRun(test.steps, actions, events, params.variant);
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
            let num = parseInt(wrp.value);
            if (wrp.value.length < 6) {
              cur.inputs[i].error.active = true;
              $_steps[$_current] = cur;
            } else if (isNaN(num)) {
              cur.inputs[i].error.active = true;
              $_steps[$_current] = cur;
            } else {
              await setStoreValue({ variable: 'serial', value: num.toString() });
              window.pumaAPI.send('n2k-serial', [num]);
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
  function cancel(e) {
    let cur = $_steps[$_current];
    if (typeof cur !== 'undefined') {
      if (typeof cur.testCode !== 'undefined') {
        let scr = { "action": "add-log", "testCode": cur.testCode, "testValue": 0 }
        runScript(scr);
      }
    }
    stopTests();
    pop();
  };
  // Data getters
  $: step = $_steps[$_current];
</script>

<Grid>
  <Row>
    <Column>
      <h2>{'5185 Poseidon 7' + (params.variant != null ? '(' + params.variant + ')' : '') + ' - Test Suite'}</h2>
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