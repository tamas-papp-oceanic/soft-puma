<script>
  import { Row, Grid, Column, InlineNotification } from "carbon-components-svelte";
  import TestContainer from './partials/TestContainer.svelte';
  import test from './tests/5185.json';
  import { start, scanDevice, waitDevice, scanSerial, waitSerial,
    startTests, startTest, waitTest, stopTests, startUpdate,
    waitUpdate, logResult, serChange } from './tests/5185.js';

  let actions = {
    "start": start,
    "scan-device": scanDevice,
    "wait-device": waitDevice,
    "scan-serial": scanSerial,
    "wait-serial": waitSerial,
    "start-tests": startTests,
    "start-test": startTest,
    "wait-test": waitTest,
    "stop-tests": stopTests,
    "start-update": startUpdate,
    "wait-update": waitUpdate,
    "log-result": logResult,
  };

  let events = {
    "ser-change": serChange,
  };
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
      <TestContainer steps={test.steps} actions={actions} events={events} style="height: 68vh;" />
    </Column>
  </Row>
</Grid>
