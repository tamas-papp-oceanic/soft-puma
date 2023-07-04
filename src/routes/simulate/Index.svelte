<script>
  import { onMount } from "svelte";
  import { Grid, Row, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { pop } from "svelte-spa-router";
  import MessageContainer from "./partials/MessageContainer.svelte";
  import SimulateContainer from "./partials/SimulateContainer.svelte";
  import nmeadefs from "../../config/nmeadefs.json";
  import { nextIncremetal, nextDecremetal, nextNatural,
    nextRandom } from '../../helpers/simulate.js';

  let selector = new Array();
  let simulator = {
    table: new Array(),
    simulation: null,
  };
  let loading = true;
  let running = false;
  let tab = 0;

  onMount((e) => {
    for (const [key, val] of Object.entries(nmeadefs)) {
      let ins = null;
      for (let i in val.fields) {
        if (typeof val.fields[i].instance !== 'undefined') {
          ins = 0;
          break;
        }
      }
      selector.push({ id: key, val: val, ins: ins });
    }
    simulator.simulation = 0;
    loading = false;
  });

  function tabchg(e) {
    tab = e.detail;
  };

  function setsim(e) {
    simulator.simulation = e.detail.selectedId;
  };

  function start(e) {
    running = true;
  };

  function addrow(e) {
    simulator.table.push(e.detail);
    simulator = simulator;
    tab = 1;
  };

  function stop(e) {
    running = false;
  };

  function cancel(e) {
    running = false;
    pop();
  };
</script>

<Grid>
  <Row>
    <Column>
      <Tabs type="container" selected={tab} on:change={tabchg}>
        <Tab label="Messages" />
        <Tab label="Simulate" />
        <svelte:fragment slot="content">
          <TabContent>
            <MessageContainer bind:data={selector} loading={loading} running={running} on:addrow={addrow} on:cancel={cancel} style="height: 80vh;" />
          </TabContent>
          <TabContent>
            <SimulateContainer bind:data={simulator} loading={loading} running={running} on:start={start} on:setsim={setsim} on:stop={stop} on:cancel={cancel} style="height: 80vh;" />
          </TabContent>
        </svelte:fragment>
      </Tabs>
    </Column>
  </Row>
</Grid>