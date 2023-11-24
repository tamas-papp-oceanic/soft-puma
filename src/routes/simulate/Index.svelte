<script>
  import { onDestroy, onMount } from "svelte";
  import { Grid, Row, Column, Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { pop } from "svelte-spa-router";
  import { v4 as uuidv4 } from "uuid";
  import MessageContainer from "./partials/MessageContainer.svelte";
  import SimulateContainer from "./partials/SimulateContainer.svelte";
  import MimicContainer from "./partials/MimicContainer.svelte";
  import nmeaconv from "../../config/nmeaconv.json";
  import nmeadefs from "../../config/nmeadefs.json";
  import j1939conv from "../../config/j1939conv.json";
  import j1939defs from "../../config/j1939defs.json";
  import datakinds from "../../config/datakinds.json";
  // import datatypes from "../../config/datatypes.json";
  import Notification from "../../components/Notification.svelte";
  import { minmax, nextIncremental, nextDecremental, nextNatural, nextRandom } from '../../helpers/simulate.js';
  import { device, protocol } from '../../stores/data.js';
  import { splitKey, joinKey, joinKey2 } from "../../helpers/route.js";
  import { isproprietary } from "../../stores/common.js";
    
  let selector = new Array();
  let simulator = {
    table: new Array(),
    simulation: null,
    rate: null,
    mimic: null,
  };
  let mimics = new Array();
  let loading = true;
  let running = false;
  let capturing = false;
  let success = false;
  let tab = 0;
  let notify = false;
  let kind = null;
  let title = null;
  let subttl = null;

  onMount((e) => {
    simulator.simulation = 0;
    simulator.rate = 0.2;
    simulator.mimic = false;
    window.pumaAPI.recv('n2k-digi-ctrl-data', (e, args) => {
      const [ dev, msg ] = args;
      if (simulator.mimic) {
        let spl = splitKey(msg.key);
        let id = 0;
        let mim = mimByInstance('3478', spl.instance);
        if (mim === null) {
          for (let i in mimics) {
            if (mimics[i].id > id) {
              id = mimics[i].id;
            }
          }
          mimics.push({
            id: ++id,
            device: '3478',
            instance: spl.instance,
            title: 'Relay Output Module',
            status: new Array(28).fill(3),
            timer: setInterval((key) => {
              mimMsg(key);
            }, 2500, msg.key),
          });
        } else {
          id = mim.id
        }
        let idx = mimById(id);
        if (idx !== -1) {
          for (let i = 1; i < 29; i++) {
            if (msg.fields[i].value !== 3) {
              mimics[idx].status[i - 1] = msg.fields[i].value;
            }
          }
        }
        mimMsg(msg.key);
      }
    });
    window.pumaAPI.recv('sim-stop', (e, args) => {
      simStop(e);
    });
    loading = false;
  });

  onDestroy((e) => {
    window.pumaAPI.reml('sim-stop');
    window.pumaAPI.reml('n2k-digi-ctrl-data');
    simulator.mimic = false;
    setMimic(e);
    capStop(e);
    simStop(e);
  });

  // Prepares message fields
  function prepFields(rec, key) {
    let spl = splitKey(key);
    let pgn = parseInt(spl.pgn);
    if (!rec.hasOwnProperty("disabledIds")) {
      rec.disabledIds = new Array();
    }
    if (!rec.hasOwnProperty("disabledSim")) {
      rec.disabledSim = new Array();
    }
    if (pgn == "126464") {
      let tmp = JSON.parse(JSON.stringify(rec.fields));
      rec.fields = new Array();
      for (let i in tmp) {
        let fld = tmp[i];
        if (fld.field < 3) {
          rec.fields.push(fld)
        }
      }
    }
    if (rec.hasOwnProperty("repeat")) {
      let flc = 0;
      for (let i in rec.repeat) {
        let rep = rec.repeat[i];
        if (rep.hasOwnProperty("startField") && (rep.startField > flc)) {
          flc = rep.startField;
        } else if (rep.hasOwnProperty("binaryField") && (rep.binaryField > flc)) {
          flc = rep.binaryField;
        }
      }
      if (flc > 0) {
        let tmp = JSON.parse(JSON.stringify(rec.fields));
        rec.fields = new Array();
        for (let i in tmp) {
          let fld = tmp[i];
          if (fld.field < flc) {
            rec.fields.push(fld);
          }
        }
      }
    }
    for (let i in rec.fields) {
      if (!rec.fields[i].hasOwnProperty("dictionary") || (rec.fields[i].dictionary === null)) {
        let spl = splitKey(rec.key);
        let key = joinKey2(spl);
        let def = {};
        if (spl.protocol === 'nmea2000')
          def = nmeadefs[key];
        else if (spl.protocol === 'j1939') {
          def = j1939defs[key];
        }
        if (typeof def !== 'undefined') {
          rec.fields[i].dictionary = def.fields[i].dictionary;
        }
      }
      let fld = rec.fields[i];
      if (!fld.hasOwnProperty("id")) {
        rec.fields[i].id = parseInt(i);
      }
      if (!fld.hasOwnProperty("static")) {
        rec.fields[i].static = false;
      }
      if (!fld.hasOwnProperty("simulation")) {
        rec.fields[i].simulation = null;
      }
      if (!fld.hasOwnProperty("limits")) {
        rec.fields[i].limits = minmax(rec.fields[i]);
      }
      if (!fld.hasOwnProperty("ranges")) {
        rec.fields[i].ranges = null;
      }
      if (!fld.hasOwnProperty("chrnum")) {
        rec.fields[i].chrnum = null;
      }
      if (!fld.hasOwnProperty("rate")) {
        rec.fields[i].rate = null;
      }
      if (((spl.protocol === 'nmea2000') && ((fld.dictionary === 'DD001') || (fld.dictionary === "DD002") ||
        (fld.dictionary === "DD003") || (fld.dictionary === "DD056"))) ||
        ((spl.protocol === 'j1939') && ((fld.dictionary === 'DD001') || (fld['type'] === 'bit(2)')))) {
        if (!fld.hasOwnProperty("value")) {
          if ((spl.protocol === 'nmea2000') && ((fld.dictionary === "DD002") || (fld.dictionary === "DD003")) ||
            ((spl.protocol === 'j1939') && (fld['type'] === 'bit(2)'))) {
            rec.fields[i].value = 3;
          } else {
            rec.fields[i].value = 0;
          }
        }
        if (!rec.disabledIds.includes(parseInt(i))) {
          rec.disabledIds.push(parseInt(i));
        }
        if (!rec.disabledSim.includes(parseInt(i))) {
          rec.disabledSim.push(parseInt(i));
        }
        rec.fields[i].static = null;
      } else if (fld.hasOwnProperty("instance")) {
        if (!rec.disabledSim.includes(parseInt(i))) {
          rec.disabledSim.push(parseInt(i));
        }
        rec.fields[i].static = null;
        if (rec.hasOwnProperty("instance")) {
          rec.fields[i].value = rec.instance;
        } else if (!fld.hasOwnProperty("value")) {
          rec.fields[i].value = 0;
        }
      } else if (fld.hasOwnProperty("fluid")) {
        rec.fluid = fld.fluid;
        if (!rec.disabledSim.includes(parseInt(i))) {
          rec.disabledSim.push(parseInt(i));
        }
        rec.fields[i].static = null;
        if (rec.hasOwnProperty("fluidtype")) {
          rec.fields[i].value = rec.fluidtype;
        } else if (!fld.hasOwnProperty("value")) {
          rec.fields[i].value = 0;
        }
      } else if (fld['type'] !== null) {
        if (fld['type'].startsWith('int') || fld['type'].startsWith('uint')) {
          if (!fld.hasOwnProperty("value")) {
            rec.fields[i].value = 0;
            rec.fields[i].sival = 0;
          }
        } else if (fld['type'].startsWith('float')) {
          if (!fld.hasOwnProperty("value")) {
            rec.fields[i].value = 0.0;
            rec.fields[i].sival = 0;
          }
        } else if (fld['type'].startsWith('bit(')) {
          if (!fld.hasOwnProperty("value")) {
            rec.fields[i].value = 0;
            rec.fields[i].sival = 0;
          }
        } else if (fld['type'].startsWith('chr(')) {
          if (!fld.hasOwnProperty("value")) {
            rec.fields[i].value = '';
          }
          let num = parseInt(fld['type'].replace('chr(', '').replace(')', ''));
          rec.fields[i].chrnum = num;
          rec.fields[i].static = null;
        } else if (fld['type'] == 'str') {
          if (!fld.hasOwnProperty("value")) {
            rec.fields[i].value = '';
          }
          rec.fields[i].chrnum = 250;
          rec.fields[i].static = null;
        }
      } else {
        if (!fld.hasOwnProperty("value")) {
          rec.fields[i].value = null;
          rec.fields[i].sival = null;
        }
      }
      if ((fld.dictionary !== null) && datakinds.hasOwnProperty(fld.dictionary)) {
        if (datakinds[fld.dictionary].hasOwnProperty("Values")) {
          if ((fld.dictionary !== "DD002") && (fld.dictionary !== "DD003")) {
            rec.fields[i].choices = new Array();
            for (const [key, val] of Object.entries(datakinds[fld.dictionary].Values)) {
              rec.fields[i].choices.push({ id: parseInt(key), text: val });
            }
            if (!fld.hasOwnProperty("value")) {
              rec.fields[i].value = rec.fields[i].choices[0].id;
            }
          }
        } else if (datakinds[fld.dictionary].hasOwnProperty("Positions")) {
          rec.fields[i].bits = datakinds[fld.dictionary].Bits;
          rec.fields[i].positions = new Array();
          for (const [key, val] of Object.entries(datakinds[fld.dictionary].Positions)) {
            let bit = rec.fields[i].value & Math.pow(2, parseInt(key));
            rec.fields[i].positions.push({ id: parseInt(key), text: val, value: (bit !== 0) });
          }
          if (!rec.disabledSim.includes(parseInt(i))) {
            rec.disabledSim.push(parseInt(i));
          }
        }          
        rec.fields[i].static = null;
      }
      if (rec.hasOwnProperty("repeat")) {
        for (let j in rec.repeat) {
          let rep = rec.repeat[j];
          if ((rec.fields[i].field === rep.repeatField) ||
            (rep.hasOwnProperty("startField") && (rec.fields[i].field >= rep.startField)) ||
            (rep.hasOwnProperty("binaryField") && (rec.fields[i].field === rep.binaryField))) {
            if (!rec.disabledIds.includes(parseInt(i))) {
              rec.disabledIds.push(parseInt(i));
            }
            if (!rec.disabledSim.includes(parseInt(i))) {
              rec.disabledSim.push(parseInt(i));
            }
            rec.fields[i].static = null;
          }
        }
      }
    }
    if (isproprietary(pgn)) {
      rec.fields[0].value = parseInt(spl.manufacturer);
      if (!rec.disabledIds.includes(0)) {
        rec.disabledIds.push(0);
      }
      if (!rec.disabledSim.includes(0)) {
        rec.disabledSim.push(0);
      }
      rec.fields[0].static = null;
      rec.fields[2].value = parseInt(spl.industry);
      if (!rec.disabledIds.includes(2)) {
        rec.disabledIds.push(2);
      }
      if (!rec.disabledSim.includes(2)) {
        rec.disabledSim.push(2);
      }
      rec.fields[2].static = null;
    }
    let cnv = spl.protocol + '/' + spl.pgn;
    if ((spl.protocol === 'nmea2000') && nmeaconv.hasOwnProperty(cnv)) {
      rec.fields[nmeaconv[cnv].field].value = parseInt(spl.function);
      if (!rec.disabledIds.includes(nmeaconv[cnv].field)) {
        rec.disabledIds.push(nmeaconv[cnv].field);
      }
      if (!rec.disabledSim.includes(nmeaconv[cnv].field)) {
        rec.disabledSim.push(nmeaconv[cnv].field);
      }
      rec.fields[nmeaconv[cnv].field].static = null;
    } else if ((spl.protocol === 'j1939') && j1939conv.hasOwnProperty(cnv)) {
      rec.fields[j1939conv[cnv].field].value = parseInt(spl.function);
      if (!rec.disabledIds.includes(j1939conv[cnv].field)) {
        rec.disabledIds.push(j1939conv[cnv].field);
      }
      if (!rec.disabledSim.includes(j1939conv[cnv].field)) {
        rec.disabledSim.push(j1939conv[cnv].field);
      }
      rec.fields[j1939conv[cnv].field].static = null;
    }
    rec.disabledIds.sort();
    rec.disabledSim.sort();
    return rec;
  };

  // Toggle disabled fields
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
          if (((spl.protocol === 'nmea2000') && ((fld.dictionary === 'DD001') || (fld.dictionary === "DD002") ||
            (fld.dictionary === "DD003") || (fld.dictionary === "DD056"))) ||
            ((spl.protocol === 'j1939') && ((fld.dictionary === 'DD001') || (fld['type'] === 'bit(2)')))) {
            if (!simulator.table[i].disabledIds.includes(parseInt(j))) {
              simulator.table[i].disabledIds.push(parseInt(j));
            }
          }
        }
        if (simulator.table[i].hasOwnProperty("repeat")) {
          for (let k in simulator.table[i].repeat) {
            if ((simulator.table[i].fields[j].field == simulator.table[i].repeat[0].repeatField) ||
              (simulator.table[i].repeat[0].hasOwnProperty("startField") &&
              (simulator.table[i].fields[j].field >= simulator.table[i].repeat[0].startField)) ||
              (simulator.table[i].repeat[0].hasOwnProperty("binaryField") &&
              (simulator.table[i].fields[j].field === simulator.table[i].repeat[0].binaryField))) {
              if (!simulator.table[i].disabledIds.includes(parseInt(j))) {
                simulator.table[i].disabledIds.push(parseInt(j));
              }
            }
          }
        }
      }
      if (!val) {
        if (isproprietary(pgn)) {
          if (!simulator.table[i].disabledIds.includes(0)) {
            simulator.table[i].disabledIds.push(0);
          }
          if (!simulator.table[i].disabledIds.includes(2)) {
            simulator.table[i].disabledIds.push(2);
          }
        }
        let cnv = spl.protocol + '/' + spl.pgn;
        if ((spl.protocol === 'nmea2000') && nmeaconv.hasOwnProperty(cnv)) {
          if (!simulator.table[i].disabledIds.includes(nmeaconv[cnv].field)) {
            simulator.table[i].disabledIds.push(nmeaconv[cnv].field);
          }
        } else if ((spl.protocol === 'j1939') && j1939conv.hasOwnProperty(cnv)) {
          if (!simulator.table[i].disabledIds.includes(j1939conv[cnv].field)) {
            simulator.table[i].disabledIds.push(j1939conv[cnv].field);
          }
        }
      }
      simulator.table[i].disabledIds.sort();
    }
  };

  // Remove listeners
  function reml(lis) {
    window.pumaAPI.reml(lis + '-done');
  };

  function getValue(rec, pro) {
    for (let i in rec.fields) {
      if (rec.fields[i].hasOwnProperty(pro)) {
        return rec.fields[i].value;
      }
    }
    return null;
  };

  function tabChg(e) {
    tab = e.detail;
    if (tab == 0) {
      capStop(e);
      simStop(e);
    }
  };

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
        if (!res.hasOwnProperty("simulation")) {
          res.simulation = 0;
        }
        if (!res.hasOwnProperty("rate")) {
          res.rate = 0.2;
        }
        if (!res.hasOwnProperty("mimic")) {
          res.mimic = false;
        }
        for (let i in res.table) {
          let row = prepFields(res.table[i], res.table[i].key);
          res.table[i] = JSON.parse(JSON.stringify(row));
        }
        simulator = JSON.parse(JSON.stringify(res));
        simulator = simulator;
      }
      reml('simfile');
      running = false;
    });
    window.pumaAPI.send('simfile-read', ['Select simulator file', 'simulator.json']);
  };

  function save(e) {
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
    let snd = JSON.parse(JSON.stringify(simulator))
    for (let i in snd.table) {
      for (let j in snd.table[i].fields) {
        if (snd.table[i].fields[j].hasOwnProperty("sival")) {
          delete snd.table[i].fields[j].sival;
        }
      }
    }
    window.pumaAPI.send('simfile-write', ['Select simulator file', 'simulator.json', snd]);
  };

  function clrTab(e) {
    simulator.table = new Array();
    simulator = simulator;
    tab = 0;
  };

  function capStart(e) {
    simulator.table = new Array();
    simulator = simulator;
    capturing = true;
    // Captures NMEA messages
    window.pumaAPI.recv('capt-data', (e, args) => {
      let [ dev, msg ] = args;
      let spl = splitKey(msg.key);
      let ins = spl.instance !== null ? parseInt(spl.instance) : null;
      let flu = spl.fluidtype !== null ? parseInt(spl.fluidtype) : null;
      let srt = false;
      for (const [key, val] of Object.entries(nmeadefs)) {
        if (key === joinKey2(spl)) {
          let rec = Object.assign(
            { id: uuidv4(), key: msg.key, pgn: spl.pgn, instance: ins, fluidtype: flu }, val,
            { disabledIds: new Array(), disabledSim: new Array(), timer: null }
          );
          rec = prepFields(rec, key);
          let fnd = false;
          for (let i in simulator.table) {
            if (simulator.table[i].key === rec.key) {
              fnd = true;
              srt = true;
              break;
            }
          }
          if (!fnd) {
            simulator.table.push(JSON.parse(JSON.stringify(rec)));
          }
          break;
        }
      }
      if (srt) {
        simulator.table.sort((a, b) => {
          if (a.key < b.key) {
            return -1;
          }
          if (a.key > b.key) {
            return 1;
          }
          return 0;
        });
        simulator = simulator;
      }
    });
    window.pumaAPI.send('capt-start', [$device]);
  };

  function capStop(e) {
    capturing = false;
    // Remove NMEA capture
    window.pumaAPI.reml('capt-data');
    window.pumaAPI.send('capt-stop', [$device]);
  };

  function simMsg(idx) {
    let key = simulator.table[idx].key;
    let spl = splitKey(key);
    let pgn = parseInt(spl.pgn);
    for (let i in simulator.table[idx].fields) {
      let fld = simulator.table[idx].fields[i];
      let val = (!fld.hasOwnProperty("value")) ? null : fld.value;
      if ((spl.protocol === 'nmea2000') && (fld.dictionary === 'DD056')) {
        val = (val + 1) % 253;
      } else if (fld['type'] != null) {
        if (fld['type'].startsWith('int') || fld['type'].startsWith('uint') ||
          (fld.unit !== null)) {
          if ((!fld.hasOwnProperty("sival")) || (fld.sival === null)) {
            simulator.table[idx].fields[i].sival = 0;
          }
          val = (val === null) ? 0 : val;
          let ena = true;
          if ((simulator.table[idx].hasOwnProperty("disabledSim")) &&
            (simulator.table[idx].disabledSim.indexOf(fld.id) !== -1)) {
            ena = false;
          }
          if (fld.static) {
            ena = false;
          }
          if (ena) {
            let sim = (fld.simulation !== null) ? fld.simulation : simulator.simulation;
            let rat = (fld.rate !== null) ? fld.rate : simulator.rate;
            let res = null;
            switch (sim) {
            case 0:
              res = nextIncremental(fld, rat);
              break;
            case 1:
              res = nextDecremental(fld, rat);
              break;
            case 2:
              res = nextNatural(fld, rat);
              break;
            case 3:
              res = nextRandom(fld);
              break;
            }
            if (res !== null) {
              val = res.value;
              simulator.table[idx].fields[i].sival = res.sival;
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
      simulator.table[idx].fields[i].value = val;
    }
    let msg = {
      key: key,
      header: { pgn: pgn, src: null, dst: 0xFF },
      fields: simulator.table[idx].fields,
    }
    for (let i in msg.fields) {
      if (msg.fields[i].hasOwnProperty("instance")) {
        msg.fields[i].value = simulator.table[idx].instance;
        break;
      }
    }
    for (let i in msg.fields) {
      if (msg.fields[i].hasOwnProperty("fluid")) {
        msg.fields[i].value = simulator.table[idx].fluidtype;
        break;
      }
    }
    window.pumaAPI.send('sim-data', [$device, msg]);
  };
    
  function mimByInstance(dev, ins) {
    for (let i in mimics) {
      if ((mimics[i].device === dev) && (mimics[i].instance == ins)) {
        return mimics[i];
      }
    }
    return null;
  }

  function mimById(id) {
    for (let i in mimics) {
      if (mimics[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  function mimMsg(key) {
    let spl = splitKey(key);
    spl.pgn = 127501;
    key = joinKey(spl);
    let msg = {
      key: key,
      header: { pgn: spl.pgn, src: null, dst: 0xFF },
      fields: new Array(),
    }
    msg.fields.push({
      field: 1,
      title: "Binary Device Bank Instance",
      type: "uint8",
      value: spl.instance,
    });
    let val = mimByInstance('3478', spl.instance);
    for (let i = 0; i < 28; i++) {
      msg.fields.push({
        field: i + 2,
        title: "Status " + (i + 1),
        type: "bit(2)",
        value: ((val !== null) && (typeof val.status[i] !== 'undefined')) ? val.status[i] : 2,
      });
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

  function simStart(e) {
    running = true;
    setDisabled(true);
    for (let i in simulator.table) {
      if ((simulator.table[i].hasOwnProperty("interval")) && (simulator.table[i].interval != null)) {
        simulator.table[i].timer = setInterval((i) => { simMsg(i); }, simulator.table[i].interval, i);
      }
    }
  };

  function simStop(e) {
    setDisabled(false);
    for (let i in simulator.table) {
      if ((simulator.table[i].hasOwnProperty("timer")) && (simulator.table[i].timer != null)) {
        clearInterval(simulator.table[i].timer);
        simulator.table[i].timer = null;
      }
    }
    running = false;
  };

  function setMimic(e) {
    if (!simulator.mimic) {
      for (let i in mimics) {
        clearInterval(mimics[i].timer);
        mimics[i].timer = null;
      }
      mimics = new Array();
    }
  };

  function cancel(e) {
    running = false;
    pop();
  };

  function setProtocol(pro) {
    if (running) {
      capStop();
      simStop();
    }
    simulator.table = new Array();
    let arr = new Array();
    let des = nmeadefs;
    if (pro === 'j1939') {
      des = j1939defs;
    }
    for (const [key, val] of Object.entries(des)) {
      let rec = Object.assign({ id: uuidv4(), key: key }, val, { disabledIds: new Array(), disabledSim: new Array() });
      rec = prepFields(rec, key);
      arr.push(rec);
    }
    arr.sort((a, b) => { return a.key.localeCompare(b.key); });
    selector = JSON.parse(JSON.stringify(arr));
    tab = 0;
  };

  // Data getters, setters
  $: $protocol, setProtocol($protocol);
</script>

<Grid>
  <Row>
    <Column>
      <Tabs type="container" selected={tab} on:change={tabChg}>
        <Tab label="Messages" />
        <Tab label="Simulator" />
        {#if simulator.mimic}
          <Tab label="Mimics" />
        {/if}
        <svelte:fragment slot="content">
          <TabContent>
            <MessageContainer
              bind:data={selector}
              loading={loading}
              on:addrow={addRow}
              on:cancel={cancel}
              style="height: calc(100vh - 10rem);" />
          </TabContent>
          <TabContent>
            <SimulateContainer
              bind:data={simulator}
              loading={loading}
              running={running}
              capturing={capturing}
              success={success}
              on:delrow={delRow}
              on:load={load}
              on:save={save}
              on:clrtab={clrTab}
              on:capstart={capStart}
              on:capstop={capStop}
              on:send={send}
              on:simstart={simStart}
              on:simstop={simStop}
              on:mimic={setMimic}
              on:cancel={cancel}
              style="height: calc(100vh - 10rem);" />
          </TabContent>
          {#if simulator.mimic}
            <TabContent>
              <MimicContainer
                bind:data={mimics}
                on:cancel={cancel}
                style="height: calc(100vh - 10rem);" />
            </TabContent>
          {/if}          
        </svelte:fragment>
      </Tabs>
      {#if notify}
        <Notification kind={kind} title={title} subtitle={subttl} bind:notify={notify} />
      {/if}
    </Column>
  </Row>
</Grid>
