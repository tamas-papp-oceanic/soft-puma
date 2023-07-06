<script>
  import { onDestroy, onMount } from "svelte";
  import { Grid, Row, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { pop } from "svelte-spa-router";
  import MessageContainer from "./partials/MessageContainer.svelte";
  import SimulateContainer from "./partials/SimulateContainer.svelte";
  import nmeadefs from "../../config/nmeadefs.json";
  import Notification from "../../components/Notification.svelte";
  import { nextIncremetal, nextDecremetal, nextNatural,
    nextRandom } from '../../helpers/simulate.js';
  import { device } from '../../stores/data.js';
  import { splitKey, joinKey } from "../../helpers/route.js";
  import { isproprietary } from "../../stores/common.js";
    
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
      let flu = null;
      for (let i in val.fields) {
        if (typeof val.fields[i].instance !== 'undefined') {
          ins = 0;
          break;
        }
      }
      for (let i in val.fields) {
        if (typeof val.fields[i].fluid !== 'undefined') {
          flu = 0;
          break;
        }
      }
      selector.push({ id: key, val: val, ins: ins, flu: flu });
    }
    simulator.simulation = 0;
    loading = false;
  });

  onDestroy((e) => {
    stop(e);
  });

  function tabChg(e) {
    tab = e.detail;
  };

  function addRow(e) {
    let oid = e.detail.id;
    let spl = splitKey(e.detail.id);
    spl.instance = e.detail.ins != null ? e.detail.ins.toString() : null;
    spl.fluidtype = e.detail.flu != null ? e.detail.flu.toString() : null;
    e.detail.id = joinKey(spl);
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
      values.push({ id: e.detail.id, ins: e.detail.ins, flu: e.detail.flu, def: nmeadefs[oid], tim: null })
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

  function simMsg(idx) {
    let key = values[idx].id;
    let spl = splitKey(key);
    let pgn = parseInt(spl.pgn);
    if (isproprietary(pgn)) {
      values[idx].def.fields[0].value = parseInt(spl.manufacturer);
      values[idx].def.fields[2].value = parseInt(spl.industry);
    }
    for (let i in values[idx].def.fields) {
      let fld = values[idx].def.fields[i];
      let val = (typeof fld.value === 'undefined') ? null : fld.value;
      if (fld['type'].startsWith('int') || fld['type'].startsWith('uint')) {
        val = (val == null) ? 0 : val;
        switch (simulator.simulation) {
        case 1:
          val = nextIncremetal(fld);
          break;
        case 2:
          val = nextDecremetal(fld);
          break;
        case 3:
          val = nextNatural(fld);
          break;
        case 4:
          val = nextRandom(fld);
          break;
        }
      } else if (fld['type'].startsWith('bit(')) {
        val = (val == null) ? 0 : val;
        if (fld.dictionary == 'DD001') {
          let num = parseInt(fld['type'].replace('bit(', '').replace(')', ''));
          if (Number.isInteger(num)) {
            val = Math.pow(2, num) - 1;
          }
        }
      } else if (fld['type'].startsWith('chr(') || (fld['type'] == 'str')) {
        val = (val == null) ? '' : val;
      }
      values[idx].def.fields[i].value = val;
    }
    let msg = {
      key: key,
      header: { pgn: pgn, src: null, dst: 0xFF },
      fields: values[idx].def.fields,
    }
    for (let i in msg.fields) {
      if (typeof msg.fields[i].instance !== 'undefined') {
        msg.fields[i].value = values[idx].ins;
        break;
      }
    }
    for (let i in msg.fields) {
      if (typeof msg.fields[i].fluid !== 'undefined') {
        msg.fields[i].value = values[idx].flu;
        break;
      }
    }
    window.pumaAPI.send('sim-data', [$device, msg]);
  };
    
  function send(e) {
    for (let i in simulator.table) {
      if (JSON.stringify(simulator.table[i]) === JSON.stringify(e.detail)) {
        simMsg(i);
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
        values[i].tim = setInterval((i) => { simMsg(i); }, values[i].def.interval, i);
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