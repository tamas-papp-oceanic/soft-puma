<script>
  import { onDestroy, onMount } from "svelte";
  import { Grid, Row, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { pop } from "svelte-spa-router";
  import { v4 as uuidv4 } from "uuid";
  import MessageContainer from "./partials/MessageContainer.svelte";
  import SimulateContainer from "./partials/SimulateContainer.svelte";
  import nmeaconv from "../../config/nmeaconv.json";
  import nmeadefs from "../../config/nmeadefs.json";
  import Notification from "../../components/Notification.svelte";
  import { minmax, ranges, nextIncremetal, nextDecremetal, nextNatural,
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
  let success = false;
  let tab = 0;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount((e) => {
    let arr = new Array();
    for (const [key, val] of Object.entries(nmeadefs)) {
      let rec = Object.assign({ id: uuidv4(), key: key }, val, { disabledIds: new Array() });
      let spl = splitKey(key);
      let pgn = parseInt(spl.pgn);
      for (let i in rec.fields) {
        rec.fields[i] = Object.assign(
          { id: parseInt(i) },
          rec.fields[i],
          {
            static: false,
            limits: minmax(rec.fields[i]),
            ranges: ranges(rec.fields[i]),
            chrnum: null,
          },
        );
        let fld = rec.fields[i];
        if (fld.dictionary == "DD056") {
          rec.fields[i].value = 0;
          rec.disabledIds.push(parseInt(i));
          rec.fields[i].static = null;
        } else {
          if (fld['type'] != null) {
            if (typeof fld.instance !== 'undefined') {
              rec.fields[i].value = 0;
              rec.fields[i].static = null;
            }
            if (typeof fld.fluid !== 'undefined') {
              rec.fields[i].value = 0;
              rec.fields[i].static = null;
            }
            if (fld['type'].startsWith('int') || fld['type'].startsWith('uint')) {
              rec.fields[i].value = 0;
            } else if (fld['type'].startsWith('float')) {
              rec.fields[i].value = 0.0;
            } else if (fld['type'].startsWith('bit(')) {
              rec.fields[i].value = 0;
              if (fld.dictionary == 'DD001') {
                rec.fields[i].value = fld.limits.max;
                rec.disabledIds.push(parseInt(i))
              }
              rec.fields[i].static = null;
            } else if (fld['type'].startsWith('chr(')) {
              rec.fields[i].value = '';
              let num = parseInt(fld['type'].replace('chr(', '').replace(')', ''));
              rec.fields[i].chrnum = num;
              rec.fields[i].static = null;
            } else if (fld['type'] == 'str') {
              rec.fields[i].value = '';
              rec.fields[i].chrnum = 250;
              rec.fields[i].static = null;
            }
          } else {
            rec.fields[i].value = null;
          }
        }
      }
      if (isproprietary(pgn)) {
        rec.fields[0].value = parseInt(spl.manufacturer);
        rec.disabledIds.push(0);
        rec.fields[0].static = null;
        rec.fields[2].value = parseInt(spl.industry);
        rec.disabledIds.push(2);
        rec.fields[2].static = null;
      }
      let cnv = spl.protocol + '/' + spl.pgn;
      if (typeof nmeaconv[cnv] !== 'undefined') {
        rec.fields[nmeaconv[cnv].field].value = parseInt(spl.function);
        rec.disabledIds.push(nmeaconv[cnv].field);
        rec.fields[nmeaconv[cnv].field].static = null;
      }
      arr.push(rec);
    }
    arr.sort((a, b) => { return a.key.localeCompare(b.key); });
    selector = JSON.parse(JSON.stringify(arr));
    simulator.simulation = 0;
    loading = false;
  });

  onDestroy((e) => {
    stop(e);
  });

  function reml(lis) {
    // Remove listeners
    window.pumaAPI.reml(lis + '-done');
  }

  function setDisabled(val) {
    for (let i in simulator.table) {
      simulator.table[i].disabledIds = new Array();
      let msg = simulator.table[i];
      let spl = splitKey(msg.key);
      let pgn = parseInt(spl.pgn);
      for (let j in msg.fields) {
        if (val) {
          simulator.table[i].disabledIds.push(parseInt(j));
        } else {
          let fld = msg.fields[j];
          if ((fld.dictionary == "DD001") || (fld.dictionary == "DD056")) {
            simulator.table[i].disabledIds.push(parseInt(j));
          }
        }
      }
      if (!val) {
        if (isproprietary(pgn)) {
          simulator.table[i].disabledIds.push(0);
          simulator.table[i].disabledIds.push(2);
        }
        let cnv = spl.protocol + '/' + spl.pgn;
        if (typeof nmeaconv[cnv] !== 'undefined') {
          simulator.table[i].disabledIds.push(nmeaconv[cnv].field);
        }
      }
    }
  }

  function tabChg(e) {
    stop(e);
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
    let spl = splitKey(e.detail.key);
    let ins = getValue(e.detail, 'instance');
    let flu = getValue(e.detail, 'fluid');
    spl.instance = ins;
    spl.fluidtype = flu;
    e.detail.id = uuidv4();    
    e.detail.key = joinKey(spl);
    let rec = Object.assign(e.detail, { instance: ins, fluidtype: flu, timer: null });
    simulator.table.push(rec);
    simulator = simulator;
    tab = 1;
  };

  function delRow(e) {
    for (let i in simulator.table) {
      if (JSON.stringify(simulator.table[i].id) === JSON.stringify(e.detail.id)) {
        simulator.table.splice(i, 1);
        simulator = simulator;
        break;
      }
    }
  };

  function load(e) {
    stop();
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    // Receives opening result
    window.pumaAPI.recv('simfile-done', (e, res) => {
      if (res instanceof Error) {
        if (res.message != 'Nothing selected') {
          kind = 'error'
          title = 'Error';
          subttl = res;
          notify = true;
        }
      } else {
        simulator = JSON.parse(JSON.stringify(res));
        simulator = simulator;
      }
      reml('simfile');
      running = false;
    });
    window.pumaAPI.send('simfile-read', ['Select simulator file', 'simulator.json']);
  };

  function save(e) {
    stop();
    kind = null
    title = null;
    subttl = null;
    notify = false;
    running = true;
    // Receives saving result
    window.pumaAPI.recv('simfile-done', (e, res) => {
      if (res instanceof Error) {
        kind = 'error'
        title = 'Error';
        subttl = res;
        notify = true;
      } else {
        kind = 'info'
        title = 'Success';
        subttl = 'Simulation table has been saved.';
        notify = true;
      }
      reml('simfile');
      running = false;
    });
    window.pumaAPI.send('simfile-write', ['Select simulator file', 'simulator.json', JSON.parse(JSON.stringify(simulator))]);
  };

  function clrTab(e) {
    simulator.table = new Array();
    simulator = simulator;
    tab = 0;
  };

  function simMsg(idx) {
    let key = simulator.table[idx].key;
    let spl = splitKey(key);
    let pgn = parseInt(spl.pgn);
    for (let i in simulator.table[idx].fields) {
      let fld = simulator.table[idx].fields[i];
      let val = (typeof fld.value === 'undefined') ? null : fld.value;
      if (fld.dictionary == 'DD056') {
        val = (val + 1) % 253;
      } else {
        if (fld['type'] != null) {
          if (fld['type'].startsWith('int') || fld['type'].startsWith('uint')) {
            val = (val === null) ? 0 : val;
            if (!fld.static) {
              let dif = 0;
              if (simulator.table[idx].interval !== null) {
                if (fld.multiplier !== null) {
                  dif = Math.round(simulator.table[idx].interval / 100);
                } else {
                  dif = 1;
                }
              }
              switch (simulator.simulation) {
              case 0:
                val = nextIncremetal(fld, dif);
                break;
              case 1:
                val = nextDecremetal(fld, dif);
                break;
              case 2:
                val = nextNatural(fld, dif);
                break;
              case 3:
                val = nextRandom(fld);
                break;
              }
            }
          } else if (fld['type'].startsWith('bit(')) {
            val = (val === null) ? 0 : val;
            if (fld.dictionary == 'DD001') {
              let num = parseInt(fld['type'].replace('bit(', '').replace(')', ''));
              if (Number.isInteger(num)) {
                val = Math.pow(2, num) - 1;
              }
            }
          } else if (fld['type'].startsWith('chr(') || (fld['type'] == 'str')) {
            val = (val === null) ? '' : val;
          }
        }
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
    
  function setSim(e) {
    simulator.simulation = e.detail.selectedId;
  };

  function send(e) {
    for (let i in simulator.table) {
      if (JSON.stringify(simulator.table[i]) === JSON.stringify(e.detail)) {
        simMsg(i);
        break;
      }  
    }  
  };  

  function start(e) {
    running = true;
    setDisabled(true);
    for (let i in simulator.table) {
      if ((typeof simulator.table[i].interval !== 'undefined') && (simulator.table[i].interval != null)) {
        simulator.table[i].timer = setInterval((i) => { simMsg(i); }, simulator.table[i].interval, i);
      }
    }
  };

  function stop(e) {
    setDisabled(false);
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
              style="height: calc(100vh - 10rem);" />
          </TabContent>
          <TabContent>
            <SimulateContainer
              bind:data={simulator}
              loading={loading}
              running={running}
              success={success}
              on:delrow={delRow}
              on:load={load}
              on:save={save}
              on:clrtab={clrTab}
              on:setsim={setSim}
              on:send={send}
              on:start={start}
              on:stop={stop}
              on:cancel={cancel}
              style="height: calc(100vh - 10rem);" />
          </TabContent>
        </svelte:fragment>
      </Tabs>
      {#if notify}
        <Notification kind={kind} title={title} subtitle={subttl} bind:notify={notify} />
      {/if}
    </Column>
  </Row>
</Grid>
