<script>
  import {
    Row,
    Grid,
    Column,
    Tabs,
    Tab,
    TabContent,
    InlineNotification
  } from "carbon-components-svelte";
  import {
    push,
    pop
  } from 'svelte-spa-router'
  import TestContainer from './partials/TestContainer.svelte';
  import steps from './tests/5185.json';
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
      <TestContainer steps={steps} />
    </Column>
  </Row>
</Grid>
