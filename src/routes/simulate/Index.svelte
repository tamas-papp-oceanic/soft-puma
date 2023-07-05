<script>
  import { onMount } from "svelte";
  import { Grid, Row, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { pop } from "svelte-spa-router";
  import MessageContainer from "./partials/MessageContainer.svelte";
  import SimulateContainer from "./partials/SimulateContainer.svelte";
  import nmeadefs from "../../config/nmeadefs.json";
  import Notification from "../../components/Notification.svelte";
  import { nextIncremetal, nextDecremetal, nextNatural,
    nextRandom } from '../../helpers/simulate.js';
  import { device } from '../../stores/data.js';
    import { splitKey } from "../../helpers/route";
    
  let selector = new Array();
  let simulator = {
    table: new Array(),
    simulation: null,
  };
  let values = new Array();
  let loading = true;
  let running = false;
  let tab = 0;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

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

  function tabChg(e) {
    tab = e.detail;
  };

  function addRow(e) {
    let fnd = false;
    for (let i in simulator.table) {
      if (JSON.stringify(simulator.table[i]) === JSON.stringify(e.detail)) {
        fnd = true;
        break;
      }
    }
    if (fnd) {
      kind = 'error'
      title = 'Error';
      subttl = 'Already part of the simulation.';
      notify = true;
    } else {
      simulator.table.push(e.detail);
      simulator = simulator;
      values.push({ id: e.detail.id, ins: e.detail.ins, def: nmeadefs[e.detail.id], tim: null })
      tab = 1;
    }
  };

  function delRow(e) {
    for (let i in simulator.table) {
      if (JSON.stringify(simulator.table[i]) === JSON.stringify(e.detail)) {
        simulator.table.splice(i, 1);
        simulator = simulator;
        values.splice(i, 1);
        break;
      }
    }
  };

  function clrTab(e) {
    simulator.table = new Array();
    simulator = simulator;
    values = new Array();
    tab = 0;
  };

  function send(e) {
    for (let i in simulator.table) {
      if (JSON.stringify(simulator.table[i]) === JSON.stringify(e.detail)) {
console.log(values[i])
        break;
      }
    }
  };

  function setSim(e) {
    simulator.simulation = e.detail.selectedId;
  };

  function start(e) {
    running = true;
    for (let i in values) {
      if ((typeof values[i].def.interval !== 'undefined') && (values[i].def.interval != null)) {
        values[i].tim = setInterval((i) => {
          for (let j in values[i].def.fields) {
            let fld = values[i].def.fields[j];
            let val = null;
            switch (simulator.simulation) {
            case 0:
              val = nextIncremetal(fld);
              break;
            case 1:
              val = nextDecremetal(fld);
              break;
            case 2:
              val = nextNatural(fld);
              break;
            case 3:
              val = nextRandom(fld);
              break;
            }
            values[i].def.fields[j].value = val;
            let key = values[i].id;
            let msg = {
              key: key,
              header: { pgn: splitKey(key).pgn, src: null, dst: 0xFF },
              fields: values[i].def.fields,
            }
            window.pumaAPI.send('sim-data', [$device, msg]);
          }
        }, values[i].def.interval, i);
      }
    }
  };

  function stop(e) {
    for (let i in values) {
      if ((typeof values[i].tim !== 'undefined') && (values[i].tim != null)) {
        clearInterval(values[i].tim);
        values[i].tim = null;
      }
    }
    running = false;
  };

  function cancel(e) {
    running = false;
    pop();
  };

  function sndMsg(def) {

  }
</script>

<Grid>
  <Row>
    <Column>
      <Tabs type="container" selected={tab} on:change={tabChg}>
        <Tab label="Messages" />
        <Tab label="Simulator" />
        <svelte:fragment slot="content">
          <TabContent>
            <MessageContainer
              bind:data={selector}
              loading={loading}
              running={running}
              on:addrow={addRow}
              on:cancel={cancel}
              style="height: 80vh;" />
          </TabContent>
          <TabContent>
            <SimulateContainer
              bind:data={simulator}
              loading={loading}
              running={running}
              on:delrow={delRow}
              on:clrtab={clrTab} 
              on:send={send}
              on:setsim={setSim}
              on:start={start}
              on:stop={stop}
              on:cancel={cancel}
              style="height: 80vh;" />
          </TabContent>
        </svelte:fragment>
      </Tabs>
      {#if notify}
        <Notification kind={kind} title={title} subtitle={subttl} bind:notify={notify} />
      {/if}
    </Column>
  </Row>
</Grid>