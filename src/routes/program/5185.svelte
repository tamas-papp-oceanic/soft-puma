<script>
  import { Row, Grid, Column, InlineNotification } from "carbon-components-svelte";
  import TestContainer from './partials/TestContainer.svelte';
  import test from './tests/5185.json';
  import proc from './tests/5185.js';

  let actions = {
    "scan-device": proc.scanDevice,
    "wait-device": proc.waitDevice,
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
