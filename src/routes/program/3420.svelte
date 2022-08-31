<script>
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { pop } from "svelte-spa-router";
  import ProgramContainer from './partials/ProgramContainer.svelte';

  // Cancel button event
  async function cancel(e) {
    pop();
  }
</script>

<Grid>
  <Row>
    <Column>
      <h2>{'3420 AC Monitor - Programming'}</h2>
      <ProgramContainer device="3420" on:cancel={cancel} style="height: 80vh;" />
    </Column>
  </Row>
</Grid>

<style lang="css">
</style>