import { get } from 'svelte/store';
import { routeGuard } from './guard.js';
import { name, device, allRoutes } from "../stores/data.js";
import { getdev } from '../config/devices.js';

// Check if route exists in route table
function isRoute(prf, src) {
  if (routeGuard({ location: prf })) {
    switch (prf) {
    case '/details':
    case '/messages':
    case '/monitor':
    case '/program':
    case '/simulate':
      break;
    default:
      try {
        let nms = get(name);
        let dev = get(device);
        let nam = nms[dev][src];
        dev = getdev(nam.modelVersion);
        prf += '/' + nam.modelVersion + '/:instance';
        if ((dev != null) && dev.fluid) {
          prf += '/:fluid';
        }
      } catch (err) {
        // console.log(err);
        return false;
      }
      break;
    }
    let ros = get(allRoutes)
    for (let rou of ros) {
      if (rou.startsWith(prf)) {
        return true;
      }
    }
  }
  return false;
};

// NMEA2000 key = {protocol}/{pgn}/{function}/{manufacturer}/{industry}/{instance}/{fluidtype}
// J1939 key = {protocol}/{pgn}/{instance}
function splitKey(key) {
  let ret = null;
  let spl = key.split('/');
  if (key.length <= 3) {
    ret = {
      protocol: null,
      pgn: null,
      instance: null,
    };
  } else {
    ret = {
      protocol: null,
      pgn: null,
      function: null,
      manufacturer: null,
      industry: null,
      instance: null,
      fluidtype: null,
    };
  }
  if (ret !== null) {
    for (let i = 0; i < 7; i++) {
      if (spl.length > i) {
        if (spl[i] != '-') {
          ret[Object.keys(ret)[i]] = spl[i];
        }
      }
    }
  }
  return ret;
};

function joinKey(spl) {
  let ret = '';
  ret += (spl.protocol != null ? spl.protocol : '-');
  ret += '/' + (spl.pgn != null ? spl.pgn : '-');
  if (ret.protocol === 'nmea2000') {
    ret += '/' + (spl.function != null ? spl.function : '-');
    ret += '/' + (spl.manufacturer != null ? spl.manufacturer : '-');
    ret += '/' + (spl.industry != null ? spl.industry : '-');
  }
  ret += '/' + (spl.instance != null ? spl.instance : '-');
  if (ret.protocol === 'nmea2000') {
    ret += '/' + (spl.fluidtype != null ? spl.fluidtype : '-');
  }
  return ret;
};

function joinKey2(spl) {
  let ret = '';
  ret += (spl.protocol != null ? spl.protocol : '-');
  ret += '/' + (spl.pgn != null ? spl.pgn : '-');
  if (ret.protocol === 'nmea2000') {
    ret += '/' + (spl.function != null ? spl.function : '-');
    ret += '/' + (spl.manufacturer != null ? spl.manufacturer : '-');
    ret += '/' + (spl.industry != null ? spl.industry : '-');
  }
  return ret;
};

export { isRoute, splitKey, joinKey, joinKey2 };