import { writable, get } from 'svelte/store';

const qlimit = 1024;

export const devices = writable(new Array());
export const device = writable(null);
export const clas = writable({});
export const func = writable({});
export const indu = writable({});
export const manu = writable({});
export const name = writable({});
export const data = writable({});
export const queue = writable({});
export const filter = writable(null);
export const selected = writable({
  program: 0,
});

window.pumaAPI.send('n2k-ready');

window.pumaAPI.recv('n2k-devs', (e, val) => {
  devices.set(val);
});

window.pumaAPI.recv('n2k-clas', (e, val) => {
  clas.set(val);
});

window.pumaAPI.recv('n2k-func', (e, val) => {
  func.set(val);
});

window.pumaAPI.recv('n2k-indu', (e, val) => {
  indu.set(val);
});

window.pumaAPI.recv('n2k-manu', (e, val) => {
  manu.set(val);
});
// Remove name records
window.pumaAPI.recv('n2k-clear', (e, val) => {
  name.set({});
});
// NMEA address claim message
window.pumaAPI.recv('n2k-name', (e, args) => {
  const [ dev, msg ] = args;
  let nam = {
    uniqueNumber: null,
    manufacturer: null,
    deviceInstance: null,
    function: null,
    class: null,
    systemInstance: null,
    industry: null,
    databaseVersion: null,
    productCode: null,
    modelID: null,
    softwareVersion: null,
    modelVersion: null,
    serialCode: null,
    certification: null,
    loadEquivalency: null,
    decoded: {
      manufacturer: null,
      function: null,
      class: null,
      industry: null,
    },
  };
  let acl = get(clas);
  let afu = get(func);
  let ain = get(indu);
  let ama = get(manu);
  let cla = null;
  for (let i in msg.fields) {
    let fld = msg.fields[i];
    switch (fld.field) {
      case 7:
        cla = fld.value;
        break;
    }
  }
  for (let i in msg.fields) {
    let fld = msg.fields[i];
    switch (fld.field) {
      case 1:
        nam.uniqueNumber = fld.value;
        break;
      case 2:
        nam.manufacturer = fld.value;
        if (typeof ama[fld.value] !== 'undefined') {
          nam.decoded.manufacturer = ama[fld.value];
        }
        break;
      case 3:
        nam.deviceInstance = fld.value;
        break;
      case 4:
        nam.deviceInstance += (fld.value << 3);
        break;
      case 5:
        nam.function = fld.value;
        if ((cla != null) && (typeof afu[cla] !== 'undefined') &&
          (typeof afu[cla][fld.value] !== 'undefined')) {
          nam.decoded.function = afu[cla][fld.value];
        }
        break;
      case 7:
        nam.class = fld.value;
        if (typeof acl[fld.value] !== 'undefined') {
          nam.decoded.class = acl[fld.value];
        }
        break;
      case 8:
        nam.systemInstance = fld.value;
        break;
      case 9:
        nam.industry = fld.value;
        if (typeof ain[fld.value] !== 'undefined') {
          nam.decoded.industry = ain[fld.value];
        }
        break;
    }
  }
  let src = msg.raw[3];
  let dat = get(name);
  if (typeof dat[dev] === "undefined") {
    dat[dev] = {};
  }
  let tmp = dat[dev][src];
  if ((typeof tmp !== 'undefined') && (
    (tmp.uniqueNumber != nam.uniqueNumber) ||
    (tmp.manufacturer != nam.manufacturer) ||
    (tmp.function != nam.function) ||
    (tmp.class != nam.class) ||
    (tmp.industry != nam.industry))
  ) {
    delete dat[dev][src];
  }
  dat[dev][src] = nam;
  name.set(dat);
});
// NMEA product info message
window.pumaAPI.recv('n2k-prod', (e, args) => {
  const [ dev, msg ] = args;
  let src = msg.raw[3];
  let dat = get(name);
  if (dat[dev] === "undefined") {
    dat[dev] = {};
  }
  let nam = dat[dev][src];
  if (typeof nam === 'undefined') {
    nam = {
      uniqueNumber: null,
      manufacturer: null,
      deviceInstance: null,
      function: null,
      class: null,
      systemInstance: null,
      industry: null,
      databaseVersion: null,
      productCode: null,
      modelID: null,
      softwareVersion: null,
      modelVersion: null,
      serialCode: null,
      certification: null,
      loadEquivalency: null,
      decoded: {
        manufacturer: null,
        function: null,
        class: null,
        industry: null,
      },
    };
  }
  for (let i in msg.fields) {
    let fld = msg.fields[i];
    switch (fld.field) {
      case 1:
        nam.databaseVersion = fld.value;
        break;
      case 2:
        nam.productCode = fld.value;
        break;
      case 3:
        nam.modelID = fld.value.trim();
        break;
      case 4:
        nam.softwareVersion = fld.value.trim();
        break;
      case 5:
        nam.modelVersion = fld.value.trim();
        break;
      case 6:
        nam.serialCode = fld.value.trim();
        break;
      case 7:
        nam.certification = fld.value;
        break;
      case 8:
        nam.loadEquivalency = fld.value;
        break;
    }
  }
  dat[dev][src] = nam;
  name.set(dat);
});
// Starts capture
export function start(key) {
  queue.set(new Array());
  filter.set(key);
};
// Restarts capture
export function restart() {
  queue.set(new Array());
};
// Stops capture
export function stop(key) {
  filter.set(null);
};
// Searches product code in name records
export function findProduct(pro) {
  let dat = get(name);
  for (const [key1, val1] of Object.entries(dat)) {
    for (const [key2, val2] of Object.entries(val1)) {
      if (val2.productCode == pro) {
        return { device: key1, address: key2, name: val2 };
      }
    }
  }
  return null;
};
// NMEA other messages
window.pumaAPI.recv('n2k-data', (e, args) => {
  const [ dev, msg ] = args;
  if (typeof msg.key !== 'undefined') {
    let key = msg.key;
    delete msg.key;
    let dat = get(data);
    if (typeof dat[dev] === 'undefined') {
      dat[dev] = {};
    }
    if (typeof dat[dev][key] === 'undefined') {
      dat[dev][key] = { header: { tim: msg.header.tim }};
      msg.cnt = 0;
    } else {
      msg.cnt = dat[dev][key].cnt;
    }
    msg.int = Math.round((msg.header.tim - dat[dev][key].header.tim) * 1000);
    msg.cnt++;
    dat[dev][key] = msg;
    data.set(dat);
    // Queue handling
    let flt = get(filter);
    let de2 = get(device);
    if ((flt != null) && (de2 == dev) && (key == flt)) {
      let que = get(queue);
      if (que.length < qlimit) {
        msg.cnt = que.length + 1;
        que.push(msg);
      }
      queue.set(que);
    }
  }
});
