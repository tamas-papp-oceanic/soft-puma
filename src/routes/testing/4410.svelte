<script>
  import { onMount, onDestroy } from "svelte";
  import { Row, Grid, Column } from "carbon-components-svelte";
  import { location, pop } from "svelte-spa-router";
  import Container4410 from './partials/Container4410.svelte';
  import { getname } from '../../stores/common.js';

  export let params;

  const plf = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
  
  const model = $location.split('/')[2];
  let data = {
    instance: params.instance,
    banks: new Array(),
  }

  onMount(() => {
    window.pumaAPI.recv('n2k-digi-data', (e, args) => {
      const [ dev, msg ] = args;
      if (msg.fields[0].value == data.instance) {
        for (let i = 0; i < 16; i++) {
          data.banks[i].status = msg.fields[i + 1].value;
        }
      }
    });
  });
  
  onDestroy(() => {
    window.pumaAPI.reml('n2k-digi-data');
  });

  function cancel(e) {
    pop();
  };
</script>

<Grid>
  <Row>
    <Column>
      <h2>{model + ' - ' + getname(model) + ' - Test'}</h2>
      <Container4410 bind:data={data} style="height: 80vh;" on:cancel={cancel} />
    </Column>
  </Row>
</Grid>

<style lang="css">
</style>