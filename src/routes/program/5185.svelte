<script>
  import { onMount } from "svelte";
  import { Row, Grid, Column, InlineNotification, Form, Tile,
    TextInput, ImageLoader, InlineLoading } from "carbon-components-svelte";
  import TestContainer from './partials/TestContainer.svelte';
  import test from './tests/5185.json';
  import { start, scanDevice, waitDevice, selectSerial,
    startTests, startTest, waitTest, stopTests, startUpdate,
    waitUpdate, logResult } from './tests/5185.js';
  import { initRun, runStep, nextStep, enableNext, setStoreValue } from "./tests/runner.js"
  import { _steps, _current } from '../../stores/tests.js';

  let actions = {
    "start": start,
    "scan-device": scanDevice,
    "wait-device": waitDevice,
    "select-serial": selectSerial,
    "start-tests": startTests,
    "start-test": startTest,
    "wait-test": waitTest,
    "stop-tests": stopTests,
    "start-update": startUpdate,
    "wait-update": waitUpdate,
    "log-result": logResult,
  };

  let events = {
    "ser-input": serInput,
  };

  let step;
  // On mount event  
  onMount(async () => {
    initRun(test.steps, actions, events);
    await runStep();
  });
  // Pass button event
  async function pass(e) {
    await nextStep();
    await runStep();
  };
  // Fail button event
  function fail(e) {
    console.log(e)
  };
  // Serial number input event
  async function serInput(e) {
    await setStoreValue({ variable: 'serial', value: e.detail });
    enableNext(e.detail.length > 5);
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
      <TestContainer step={step} on:pass={pass} on:fail={fail} style="height: 65vh;" />
    </Column>
  </Row>
</Grid>

<style lang="css">
</style>