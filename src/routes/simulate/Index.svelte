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
  let loading = true;
  let running = false;
  let tab = 0;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount((e) => {
    let arr = new Array();
    for (const [key, val] of Object.entries(nmeadefs)) {
      let rec = Object.assign({ id: key }, val);
      let spl = splitKey(key);
      let pgn = parseInt(spl.pgn);
      for (let i in rec.fields) {
        let fld = rec.fields[i];
        if (fld.type != null) {
          rec.fields[i].id = i;
          if (typeof fld.instance !== 'undefined') {
            rec.fields[i].value = 0;
          }
          if (typeof fld.fluid !== 'undefined') {
            rec.fields[i].value = 0;
          }
          if (fld.type.startsWith('int') || fld.type.startsWith('uint')) {
            rec.fields[i].value = 0;
          } else if (fld.type.startsWith('float')) {
            rec.fields[i].value = 0.0;
          } else if (fld.type.startsWith('bit(')) {
            rec.fields[i].value = 0;
            if (fld.dictionary == 'DD001') {
              let num = parseInt(fld.type.replace('bit(', '').replace(')', ''));
              if (Number.isInteger(num)) {
                rec.fields[i].value = Math.pow(2, num) - 1;
              }
            }
          } else if (fld.type.startsWith('chr(') || (fld.type == 'str')) {
            rec.fields[i].value = '';
          }
        }
      }
      if (isproprietary(pgn)) {
        rec.fields[0].value = parseInt(spl.manufacturer);
        rec.fields[2].value = parseInt(spl.industry);
      }
      arr.push(rec);
    }
    arr.sort((a, b) => { return a.id.localeCompare(b.id); });
    selector = JSON.parse(JSON.stringify(arr));
    simulator.simulation = 0;
    loading = false;
  });

  onDestroy((e) => {
    stop(e);
  });

  function tabChg(e) {
    tab = e.detail;
  };

  function getValue(rec, pro) {
    for (let i in rec.fields) {
      if (typeof rec.fields[i][pro] !== 'undefined') {
        return rec.fields[i].value;
      }
    }
    return null;
  }

  function addRow(e) {
    let fnd = false;
    for (let i in simulator.table) {
      if (simulator.table[i].id === e.detail.id) {
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
      let spl = splitKey(e.detail.id);
      let ins = getValue(e.detail, 'instance');
      let flu = getValue(e.detail, 'fluid');
      spl.instance = ins;
      spl.fluidtype = flu;
      e.detail.id = joinKey(spl);
      let rec = Object.assign(e.detail, { instance: ins, fluidtype: flu, timer: null });
      simulator.table.push(rec);
      simulator = simulator;
      tab = 1;
    }
  };

  function delRow(e) {
    for (let i in simulator.table) {
      if (JSON.stringify(simulator.table[i]) === JSON.stringify(e.detail)) {
        simulator.table.splice(i, 1);
        simulator = simulator;
        break;
      }
    }
  };

  function clrTab(e) {
    simulator.table = new Array();
    simulator = simulator;
    tab = 0;
  };

  function simMsg(idx) {
    let key = simulator.table[idx].id;
    let spl = splitKey(key);
    let pgn = parseInt(spl.pgn);
    for (let i in simulator.table[idx].fields) {
      let fld = simulator.table[idx].fields[i];
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
      simulator.table[idx].fields[i].value = val;
    }
    let msg = {
      key: key,
      header: { pgn: pgn, src: null, dst: 0xFF },
      fields: simulator.table[idx].fields,
    }
    for (let i in msg.fields) {
      if (typeof msg.fields[i].instance !== 'undefined') {
        msg.fields[i].value = simulator.table[idx].instance;
        break;
      }
    }
    for (let i in msg.fields) {
      if (typeof msg.fields[i].fluid !== 'undefined') {
        msg.fields[i].value = simulator.table[idx].fluidtype;
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
    for (let i in simulator.table) {
      if ((typeof simulator.table[i].interval !== 'undefined') && (simulator.table[i].interval != null)) {
        simulator.table[i].timer = setInterval((i) => { simMsg(i); }, simulator.table[i].interval, i);
      }
    }
  };

  function stop(e) {
    for (let i in simulator.table) {
      if ((typeof simulator.table[i].timer !== 'undefined') && (simulator.table[i].timer != null)) {
        clearInterval(simulator.table[i].timer);
        simulator.table[i].timer = null;
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