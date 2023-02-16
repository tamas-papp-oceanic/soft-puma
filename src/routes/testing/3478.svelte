<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container3478 from './partials/Container3478.svelte';
  import { getname } from '../../stores/common.js';

  export let params;

  const plf = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
  
  const model = $location.split('/')[2];
  let data = {
    instance: params.instance,
    source: null,
  }

  onMount(() => {
  });
  
  onDestroy(() => {
  });

  function cancel(e) {
    pop();
  };
</script>

<Grid>
  <Row>
    <Column>
      <h2>{model + ' ' + getname(model) + ' - Testing'}</h2>
      <Container3478 bind:data={data} style="height: 80vh;" on:cancel={cancel} />
    </Column>
  </Row>
</Grid>

<style lang="css">
</style>