<script>
  import { onMount } from "svelte";
  import { Row, Grid, Column, InlineNotification } from "carbon-components-svelte";
	import { pop } from 'svelte-spa-router'
  import TestContainer from './partials/TestContainer.svelte';
  import test from './tests/5185.json';
  import { start, scanDevice, waitDevice, startForm, startTests,
    startTest, waitTest, stopTests, startUpdate,  waitUpdate,
    logResult, stop } from './tests/5185.js';
  import { initRun, runStep, nextStep, setStoreValue } from "./tests/runner.js"
  import { _steps, _events, _current } from '../../stores/tests.js';

  let actions = {
    "start": start,
    "scan-device": scanDevice,
    "wait-device": waitDevice,
    "start-form": startForm,
    "start-tests": startTests,
    "start-test": startTest,
    "wait-test": waitTest,
    "stop-tests": stopTests,
    "start-update": startUpdate,
    "wait-update": waitUpdate,
    "log-result": logResult,
    "stop": stop,
  };

  let events = {};

  let step;
  // On mount event  
  onMount(async () => {
    initRun(test.steps, actions, events);
    await runStep();
  });
  // Submit button event
  async function submit(e) {
    let val = false;
    let stp = false;
    if (typeof $_steps[$_current] !== 'undefined') {
      val = true;
      if (typeof $_steps[$_current].last !== 'undefined') {
        stp = true;
      } else if (typeof $_steps[$_current].inputs !== 'undefined') {
        for (let i in $_steps[$_current].inputs) {
          let wrp = document.getElementById($_steps[$_current].inputs[i].id);
          if ($_steps[$_current].inputs[i].id == 'serial') {
            if (wrp.value.length < 6) {
              $_steps[$_current].inputs[i].error.active = true;
              // Only for reactivity
              $_steps[$_current] = $_steps[$_current];
            } else {
              await setStoreValue({ variable: 'serial', value: wrp.value });
            }
          }
          if ($_steps[$_current].inputs[i].error.active) {
            wrp.focus();
            val = false;
          }
        }
      }
    }
    if (val) {
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
    stopTests();
    logResult();
    pop();
  };
  // Data getters
  $: step = $_steps[$_current];
</script>

<Grid>
  <Row>
    <Column>
      <h2>5185 Poseidon 7 - Test Suite</h2>
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