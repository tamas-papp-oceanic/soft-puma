<script>
  import { Row, Grid, Column, InlineNotification } from "carbon-components-svelte";
  import TestContainer from './partials/TestContainer.svelte';
  import test from './tests/5185.json';
  import { start, scanDevice, waitDevice, scanSerial, waitSerial,
    startTests, startTouch, waitTouch, startBright,
    waitBright, startGps, waitGps, startUpdate, waitUpdate,
    stopTests, logResult } from './tests/5185.js';

  let actions = {
    "start": start,
    "scan-device": scanDevice,
    "wait-device": waitDevice,
    "scan-serial": scanSerial,
    "wait-serial": waitSerial,
    "start-tests": startTests,
    "start-touch": startTouch,
    "wait-touch": waitTouch,
    "start-bright": startBright,
    "wait-bright": waitBright,
    "start-gps": startGps,
    "wait-gps": waitGps,
    "start-update": startUpdate,
    "wait-update": waitUpdate,
    "stop-tests": stopTests,
    "log-result": logResult,
  }
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
      <TestContainer steps={test.steps} actions={actions} style="height: 68vh;" />
    </Column>
  </Row>
</Grid>
